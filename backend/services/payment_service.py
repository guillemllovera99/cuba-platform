"""
Payment Service Abstraction Layer

Abstracts payment processing behind a common interface so the backend
can easily swap between providers. Currently supports:
- Stripe (cards) — NOTE: Cannot be used for Cuba-destined transactions per Stripe TOS
- PayPal — NOTE: Also restricted for Cuba under OFAC
- Manual Bank Transfer — Admin confirms payment manually
- (Future) Crypto rails, regional processors, etc.

The frontend calls the same endpoints regardless of which provider is active.
"""
from enum import Enum
from dataclasses import dataclass
from typing import Optional


class PaymentProvider(str, Enum):
    STRIPE = "stripe"
    PAYPAL = "paypal"
    BANK_TRANSFER = "bank_transfer"
    # Future: CRYPTO = "crypto", PAYONEER = "payoneer"


@dataclass
class PaymentResult:
    success: bool
    provider: PaymentProvider
    redirect_url: Optional[str] = None
    reference: Optional[str] = None
    error: Optional[str] = None
    instructions: Optional[str] = None  # For bank transfer


@dataclass
class ProviderConfig:
    provider: PaymentProvider
    enabled: bool
    label: str
    description: str
    cuba_compliant: bool  # Whether this provider allows Cuba transactions


def get_available_providers() -> list[ProviderConfig]:
    """Return all configured payment providers with compliance info."""
    from config import STRIPE_ENABLED, PAYPAL_ENABLED

    providers = []

    if STRIPE_ENABLED:
        providers.append(
            ProviderConfig(
                provider=PaymentProvider.STRIPE,
                enabled=True,
                label="Credit / Debit Card (Stripe)",
                description="Pay securely with your card",
                cuba_compliant=False,  # Stripe prohibits Cuba dealings
            )
        )

    if PAYPAL_ENABLED:
        providers.append(
            ProviderConfig(
                provider=PaymentProvider.PAYPAL,
                enabled=True,
                label="PayPal",
                description="Pay with your PayPal account",
                cuba_compliant=False,  # PayPal restricted under OFAC
            )
        )

    # Bank transfer is always available
    providers.append(
        ProviderConfig(
            provider=PaymentProvider.BANK_TRANSFER,
            enabled=True,
            label="Bank Transfer",
            description="Transfer directly to our bank account. Order confirmed after verification.",
            cuba_compliant=True,
        )
    )

    return providers


def get_bank_transfer_instructions() -> dict:
    """Return bank transfer instructions."""
    from config import _get_env

    return {
        "bank_name": _get_env("BANK_TRANSFER_BANK_NAME") or "Asymmetrica Investments AG",
        "account_holder": _get_env("BANK_TRANSFER_ACCOUNT_HOLDER")
        or "Asymmetrica Investments",
        "iban": _get_env("BANK_TRANSFER_IBAN") or "CH93 0076 2011 6238 5295 7",
        "swift_bic": _get_env("BANK_TRANSFER_SWIFT") or "UBSWCHZH80A",
        "reference_prefix": "CUB",
        "note": "Please use your order code as the payment reference.",
    }
