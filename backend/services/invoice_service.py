"""
Invoice PDF generation for corporate orders.
Uses built-in reportlab-free approach: generates HTML and converts to PDF-like response,
or returns structured invoice data for frontend rendering.
"""
from datetime import datetime, timezone


def generate_invoice_data(order, corporate_profile=None) -> dict:
    """
    Generate structured invoice data from an order.
    The frontend can render this into a printable invoice, or
    we return it as a downloadable JSON/HTML document.
    """
    items = []
    for item in (order.items or []):
        items.append({
            "product_name": item.product_name,
            "quantity": item.quantity,
            "unit_price": float(item.unit_price_usd),
            "subtotal": float(item.subtotal_usd),
        })

    discount_pct = float(corporate_profile.discount_pct) if corporate_profile and corporate_profile.discount_pct else 0

    invoice = {
        "invoice_number": f"INV-{order.order_code}",
        "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "due_date": "",  # Could compute from payment terms
        "order_code": order.order_code,
        "order_id": order.id,
        # Seller info
        "seller": {
            "name": "Asymmetrica Investments AG",
            "address": "Zurich, Switzerland",
            "email": "info@asymmetrica-investments.com",
            "website": "www.asymmetrica-investments.com",
        },
        # Buyer info
        "buyer": {
            "name": order.recipient_name or "",
            "company": corporate_profile.company_name if corporate_profile else "",
            "tax_id": corporate_profile.tax_id if corporate_profile else "",
            "address": (corporate_profile.billing_address if corporate_profile else order.recipient_address) or "",
            "city": (corporate_profile.billing_city if corporate_profile else order.recipient_city) or "",
            "country": (corporate_profile.billing_country if corporate_profile else "") or "",
        },
        # Items
        "items": items,
        # Totals
        "subtotal": float(order.subtotal_usd) if order.subtotal_usd else 0,
        "discount_pct": discount_pct,
        "discount_amount": round(float(order.subtotal_usd or 0) * discount_pct / 100, 2) if discount_pct else 0,
        "total": float(order.total_usd) if order.total_usd else 0,
        "deposit_amount": float(order.deposit_amount) if order.deposit_amount else 0,
        "balance_amount": float(order.balance_amount) if order.balance_amount else 0,
        "deposit_paid": order.deposit_paid_at is not None,
        "balance_paid": order.balance_paid_at is not None,
        # Payment info
        "payment_terms": f"{int(float(corporate_profile.deposit_pct))}% deposit upfront" if corporate_profile else "20% deposit upfront",
        "bank_details": {
            "bank": "Asymmetrica Investments AG",
            "iban": "CH93 0076 2011 6238 5295 7",
            "swift": "UBSWCHZH80A",
            "reference": order.order_code,
        },
        "status": order.status,
        "is_corporate": corporate_profile is not None,
    }

    return invoice


def generate_invoice_html(invoice_data: dict) -> str:
    """Generate a printable HTML invoice from invoice data."""
    items_html = ""
    for item in invoice_data["items"]:
        items_html += f"""
        <tr>
            <td style="padding:8px; border-bottom:1px solid #eee;">{item['product_name']}</td>
            <td style="padding:8px; border-bottom:1px solid #eee; text-align:center;">{item['quantity']}</td>
            <td style="padding:8px; border-bottom:1px solid #eee; text-align:right;">${item['unit_price']:.2f}</td>
            <td style="padding:8px; border-bottom:1px solid #eee; text-align:right;">${item['subtotal']:.2f}</td>
        </tr>"""

    discount_row = ""
    if invoice_data["discount_pct"]:
        discount_row = f"""
        <tr>
            <td colspan="3" style="padding:8px; text-align:right; color:#666;">Discount ({invoice_data['discount_pct']}%)</td>
            <td style="padding:8px; text-align:right; color:#16a34a;">-${invoice_data['discount_amount']:.2f}</td>
        </tr>"""

    html = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Invoice {invoice_data['invoice_number']}</title>
<style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0B1628; margin:0; padding:40px; }}
    .invoice-header {{ display:flex; justify-content:space-between; margin-bottom:40px; }}
    .invoice-number {{ font-size:28px; font-weight:700; color:#0B1628; }}
    .invoice-meta {{ font-size:13px; color:#666; margin-top:4px; }}
    .parties {{ display:flex; justify-content:space-between; margin-bottom:32px; }}
    .party {{ max-width:45%; }}
    .party-label {{ font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#999; margin-bottom:4px; }}
    .party-name {{ font-size:16px; font-weight:600; margin-bottom:4px; }}
    .party-detail {{ font-size:13px; color:#666; }}
    table {{ width:100%; border-collapse:collapse; margin-bottom:24px; }}
    th {{ padding:10px 8px; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#999; border-bottom:2px solid #0B1628; }}
    .totals {{ margin-left:auto; width:300px; }}
    .total-row {{ display:flex; justify-content:space-between; padding:6px 0; font-size:14px; }}
    .total-row.grand {{ font-size:18px; font-weight:700; border-top:2px solid #0B1628; padding-top:12px; margin-top:8px; }}
    .badge {{ display:inline-block; padding:2px 8px; border-radius:12px; font-size:11px; font-weight:600; }}
    .badge-paid {{ background:#dcfce7; color:#16a34a; }}
    .badge-pending {{ background:#fef3c7; color:#d97706; }}
    .bank-info {{ background:#f8fafc; padding:20px; border-radius:8px; margin-top:32px; font-size:13px; }}
    .bank-label {{ color:#999; font-size:11px; text-transform:uppercase; letter-spacing:1px; }}
    @media print {{ body {{ padding:20px; }} }}
</style></head><body>
    <div class="invoice-header">
        <div>
            <div class="invoice-number">{invoice_data['invoice_number']}</div>
            <div class="invoice-meta">Date: {invoice_data['date']}</div>
            <div class="invoice-meta">Order: {invoice_data['order_code']}</div>
        </div>
        <div style="text-align:right;">
            <div style="font-size:20px; font-weight:700;">Asymmetrica</div>
            <div style="font-size:12px; color:#666;">Investments AG</div>
        </div>
    </div>

    <div class="parties">
        <div class="party">
            <div class="party-label">From</div>
            <div class="party-name">{invoice_data['seller']['name']}</div>
            <div class="party-detail">{invoice_data['seller']['address']}</div>
            <div class="party-detail">{invoice_data['seller']['email']}</div>
        </div>
        <div class="party">
            <div class="party-label">Bill To</div>
            <div class="party-name">{invoice_data['buyer']['company'] or invoice_data['buyer']['name']}</div>
            {f'<div class="party-detail">Tax ID: {invoice_data["buyer"]["tax_id"]}</div>' if invoice_data['buyer']['tax_id'] else ''}
            <div class="party-detail">{invoice_data['buyer']['address']}</div>
            <div class="party-detail">{invoice_data['buyer']['city']} {invoice_data['buyer']['country']}</div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Item</th>
                <th style="text-align:center;">Qty</th>
                <th style="text-align:right;">Unit Price</th>
                <th style="text-align:right;">Amount</th>
            </tr>
        </thead>
        <tbody>
            {items_html}
        </tbody>
    </table>

    <div class="totals">
        <div class="total-row"><span>Subtotal</span><span>${invoice_data['subtotal']:.2f}</span></div>
        {f'<div class="total-row"><span>Discount ({invoice_data["discount_pct"]}%)</span><span style="color:#16a34a;">-${invoice_data["discount_amount"]:.2f}</span></div>' if invoice_data['discount_pct'] else ''}
        <div class="total-row grand"><span>Total</span><span>${invoice_data['total']:.2f}</span></div>
        <div class="total-row" style="margin-top:12px;">
            <span>Deposit ({invoice_data['payment_terms']})</span>
            <span>${invoice_data['deposit_amount']:.2f} <span class="badge {'badge-paid' if invoice_data['deposit_paid'] else 'badge-pending'}">{'Paid' if invoice_data['deposit_paid'] else 'Pending'}</span></span>
        </div>
        <div class="total-row">
            <span>Balance Due</span>
            <span>${invoice_data['balance_amount']:.2f} <span class="badge {'badge-paid' if invoice_data['balance_paid'] else 'badge-pending'}">{'Paid' if invoice_data['balance_paid'] else 'Pending'}</span></span>
        </div>
    </div>

    <div class="bank-info">
        <div class="bank-label" style="margin-bottom:8px;">Bank Transfer Details</div>
        <div><strong>Bank:</strong> {invoice_data['bank_details']['bank']}</div>
        <div><strong>IBAN:</strong> {invoice_data['bank_details']['iban']}</div>
        <div><strong>SWIFT:</strong> {invoice_data['bank_details']['swift']}</div>
        <div><strong>Reference:</strong> {invoice_data['bank_details']['reference']}</div>
    </div>
</body></html>"""
    return html
