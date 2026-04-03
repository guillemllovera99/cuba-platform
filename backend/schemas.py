from pydantic import BaseModel, EmailStr
from typing import Optional


# ── Auth ──
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None
    account_type: Optional[str] = "buyer"  # buyer | seller | both


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    role: str
    account_type: Optional[str] = "buyer"
    full_name: Optional[str]
    phone: Optional[str]


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None


class TokenOut(BaseModel):
    access_token: str
    user: UserOut


# ── Products ──
class ProductCreate(BaseModel):
    sku: Optional[str] = None
    name: str
    description: Optional[str] = None
    category: str
    price_usd: float
    stock_quantity: int = 0
    image_url: Optional[str] = None
    is_active: bool = True


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    price_usd: Optional[float] = None
    stock_quantity: Optional[int] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None
    is_preorder: Optional[bool] = None
    preorder_deadline: Optional[str] = None
    estimated_ship_date: Optional[str] = None
    shipment_window_id: Optional[str] = None


class ProductOut(BaseModel):
    id: str
    sku: Optional[str]
    name: str
    description: Optional[str]
    category: str
    price_usd: float
    stock_quantity: int
    image_url: Optional[str]
    is_active: bool
    is_preorder: bool = False
    preorder_deadline: Optional[str] = None
    estimated_ship_date: Optional[str] = None
    shipment_window_id: Optional[str] = None


# ── Orders ──
class CartItem(BaseModel):
    product_id: str
    quantity: int


class CheckoutRequest(BaseModel):
    items: list[CartItem]
    recipient_name: str
    recipient_phone: str
    recipient_city: str
    recipient_address: Optional[str] = None
    pickup_point_id: Optional[str] = None
    notes: Optional[str] = None


class OrderItemOut(BaseModel):
    id: str
    product_id: str
    product_name: Optional[str]
    quantity: int
    unit_price_usd: float
    subtotal_usd: float


class OrderOut(BaseModel):
    id: str
    order_code: str
    status: str
    recipient_name: Optional[str]
    recipient_phone: Optional[str]
    recipient_city: Optional[str]
    recipient_address: Optional[str]
    pickup_point_id: Optional[str] = None
    subtotal_usd: Optional[float]
    total_usd: Optional[float]
    deposit_amount: Optional[float] = None
    balance_amount: Optional[float] = None
    deposit_paid_at: Optional[str] = None
    balance_paid_at: Optional[str] = None
    notes: Optional[str]
    paid_at: Optional[str]
    created_at: str
    items: list[OrderItemOut] = []


class StatusUpdate(BaseModel):
    status: str


# ── Pickup Points (Phase 5) ──
class PickupPointCreate(BaseModel):
    name: str
    city: str
    address: str
    contact_phone: Optional[str] = None
    contact_name: Optional[str] = None


class PickupPointOut(BaseModel):
    id: str
    name: str
    city: str
    address: str
    contact_phone: Optional[str]
    contact_name: Optional[str]
    is_active: bool
    created_at: str


# ── Shipments / Delivery (US-12) ──
class ShipmentEventOut(BaseModel):
    id: str
    status: str
    location: Optional[str]
    description: Optional[str]
    created_by: Optional[str]
    created_at: str


class ShipmentOut(BaseModel):
    id: str
    order_id: str
    order_code: Optional[str] = None
    carrier: Optional[str]
    tracking_number: Optional[str]
    estimated_delivery: Optional[str]
    actual_delivery: Optional[str]
    status: str
    notes: Optional[str]
    created_at: str
    updated_at: str
    events: list[ShipmentEventOut] = []
    # Denormalized recipient info for the logistics view
    recipient_name: Optional[str] = None
    recipient_city: Optional[str] = None
    recipient_phone: Optional[str] = None
    recipient_address: Optional[str] = None
    total_usd: Optional[float] = None


class ShipmentUpdate(BaseModel):
    carrier: Optional[str] = None
    tracking_number: Optional[str] = None
    estimated_delivery: Optional[str] = None
    notes: Optional[str] = None


class ShipmentEventCreate(BaseModel):
    status: str
    location: Optional[str] = None
    description: Optional[str] = None


# ── Shipment Windows (Phase 4 — preorder) ──
class ShipmentWindowCreate(BaseModel):
    name: str
    description: Optional[str] = None
    order_deadline: str  # ISO datetime
    estimated_departure: str
    estimated_arrival: Optional[str] = None

class ShipmentWindowOut(BaseModel):
    id: str
    name: str
    description: Optional[str]
    order_deadline: str
    estimated_departure: str
    estimated_arrival: Optional[str]
    is_active: bool
    created_at: str


# ── Corporate / B2B (Phase 7) ──
class CorporateProfileCreate(BaseModel):
    company_name: str
    tax_id: Optional[str] = None
    industry: Optional[str] = None
    billing_address: Optional[str] = None
    billing_city: Optional[str] = None
    billing_country: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None


class CorporateProfileUpdate(BaseModel):
    company_name: Optional[str] = None
    tax_id: Optional[str] = None
    industry: Optional[str] = None
    billing_address: Optional[str] = None
    billing_city: Optional[str] = None
    billing_country: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None


class CorporateProfileOut(BaseModel):
    id: str
    user_id: str
    company_name: str
    tax_id: Optional[str]
    industry: Optional[str]
    billing_address: Optional[str]
    billing_city: Optional[str]
    billing_country: Optional[str]
    contact_name: Optional[str]
    contact_phone: Optional[str]
    status: str
    approved_at: Optional[str]
    pricing_tier: str
    discount_pct: float
    deposit_pct: float
    notes: Optional[str]
    created_at: str
    # User info
    user_email: Optional[str] = None
    user_name: Optional[str] = None


class CorporateApproval(BaseModel):
    status: str  # approved | rejected
    pricing_tier: Optional[str] = None  # standard | silver | gold | platinum
    discount_pct: Optional[float] = None
    deposit_pct: Optional[float] = None
    notes: Optional[str] = None


# ── Wallet / Token System (Phase 8) ──
class WalletOut(BaseModel):
    id: str
    user_id: str
    balance: float
    reserved: float
    currency: str
    created_at: str
    updated_at: str


class WalletTransactionOut(BaseModel):
    id: str
    wallet_id: str
    tx_type: str
    amount: float
    balance_after: float
    reference_type: Optional[str]
    reference_id: Optional[str]
    description: Optional[str]
    created_by: Optional[str]
    created_at: str


class WalletTopup(BaseModel):
    amount: float  # Must be positive


class WalletSpend(BaseModel):
    amount: float
    order_id: Optional[str] = None
    description: Optional[str] = None


class AdminWalletAdjust(BaseModel):
    user_id: str
    amount: float  # Positive = credit, negative = debit
    description: Optional[str] = None


# ── Feedback / Recipient (Phase 9) ──
class FeedbackCreate(BaseModel):
    order_code: str
    rating: str  # ok | problem
    comment: Optional[str] = None
    category: Optional[str] = None  # delivery | quality | missing_items | damaged | other


class FeedbackOut(BaseModel):
    id: str
    order_id: str
    order_code: str
    rating: str
    comment: Optional[str]
    category: Optional[str]
    photo_url: Optional[str]
    created_at: str


class RecipientTrackingOut(BaseModel):
    order_code: str
    status: str
    recipient_name: Optional[str]
    recipient_city: Optional[str]
    pickup_point_name: Optional[str] = None
    pickup_point_address: Optional[str] = None
    estimated_delivery: Optional[str] = None
    shipment_status: Optional[str] = None
    shipment_events: list[ShipmentEventOut] = []
    delivery_confirmed: bool = False
    pickup_code: Optional[str] = None
    has_feedback: bool = False


class DeliveryConfirmationCreate(BaseModel):
    order_id: str
    pickup_code: Optional[str] = None
    recipient_id_check: bool = False
    notes: Optional[str] = None


class DeliveryConfirmationOut(BaseModel):
    id: str
    order_id: str
    confirmed_by: Optional[str]
    pickup_code: Optional[str]
    recipient_id_check: bool
    photo_url: Optional[str]
    notes: Optional[str]
    confirmed_at: str


# ── Partner (Phase 10) ──
class PartnerProfileCreate(BaseModel):
    company_name: str
    region: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_name: Optional[str] = None


class PartnerProfileOut(BaseModel):
    id: str
    user_id: str
    company_name: str
    region: Optional[str]
    contact_phone: Optional[str]
    contact_name: Optional[str]
    status: str
    approved_at: Optional[str]
    notes: Optional[str]
    created_at: str
    user_email: Optional[str] = None
    user_name: Optional[str] = None


# ── Supplier (Phase 10) ──
class SupplierProfileCreate(BaseModel):
    company_name: str
    country: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    product_categories: Optional[str] = None


class SupplierProfileOut(BaseModel):
    id: str
    user_id: str
    company_name: str
    country: Optional[str]
    contact_name: Optional[str]
    contact_email: Optional[str]
    contact_phone: Optional[str]
    product_categories: Optional[str]
    status: str
    approved_at: Optional[str]
    notes: Optional[str]
    created_at: str
    user_email: Optional[str] = None
    user_name: Optional[str] = None


class PurchaseOrderCreate(BaseModel):
    supplier_id: str
    items: list[dict]  # [{description, quantity, unit_cost_usd, product_id?}]
    notes: Optional[str] = None


class PurchaseOrderItemOut(BaseModel):
    id: str
    product_id: Optional[str]
    description: str
    quantity: int
    unit_cost_usd: float
    subtotal_usd: float


class PurchaseOrderOut(BaseModel):
    id: str
    po_number: str
    supplier_id: str
    status: str
    total_usd: Optional[float]
    notes: Optional[str]
    sent_at: Optional[str]
    confirmed_at: Optional[str]
    shipped_at: Optional[str]
    created_by: Optional[str]
    created_at: str
    updated_at: str
    items: list[PurchaseOrderItemOut] = []
    supplier_name: Optional[str] = None
