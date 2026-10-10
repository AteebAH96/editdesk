// Email notifications via Resend (free tier — no card required).
// Sends the admin an email whenever a client places a new order.
// Silently no-ops when RESEND_API_KEY / ADMIN_EMAIL are not configured,
// and never blocks or fails the request that triggered it.

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));
}

async function sendNewOrderEmail(order) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ADMIN_EMAIL;
  if (!apiKey || !to) return;

  const clientName = escapeHtml(order.client?.name || 'A client');
  const clientEmail = escapeHtml(order.client?.email || '');
  const title = escapeHtml(order.title);
  const type = escapeHtml(order.type || '');
  const desc = escapeHtml(order.description || '');
  const appUrl = (process.env.CLIENT_URL || '').replace(/\/$/, '');

  const subject = `\u{1F514} New EditDesk order: ${order.title}`;
  const html = `
    <div style="font-family: -apple-system, sans-serif; max-width: 560px; color: #1d1d1f;">
      <h2 style="margin-bottom: 4px;">New order received \u{1F3AC}</h2>
      <p style="color: #6e6e73;">Someone just placed an order on EditDesk.</p>
      <p><strong>Title:</strong> ${title}</p>
      <p><strong>Type:</strong> ${type}</p>
      <p><strong>Client:</strong> ${clientName}${clientEmail ? ` (${clientEmail})` : ''}</p>
      ${order.deadline ? `<p><strong>Deadline:</strong> ${escapeHtml(new Date(order.deadline).toDateString())}</p>` : ''}
      ${desc ? `<p><strong>Brief:</strong></p><p>${desc}</p>` : ''}
      ${appUrl ? `<p><a href="${escapeHtml(appUrl)}/orders/${order._id}">Open in EditDesk &rarr;</a></p>` : ''}
    </div>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'EditDesk <onboarding@resend.dev>',
        to,
        subject,
        html,
      }),
    });
    if (!res.ok) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Resend email failed:', res.status);
      }
    }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('Resend email error:', err.message);
  }
}

// Fire-and-forget wrapper — never blocks or fails the request.
function notifyNewOrder(order) {
  sendNewOrderEmail(order).catch(() => {});
}

module.exports = { notifyNewOrder };
