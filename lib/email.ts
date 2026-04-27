import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendWelcomeEmail(email: string, name: string, uniqueId: string) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'LAMS Boutique <noreply@lams.com>',
    to: email,
    subject: 'Bienvenue chez LAMS – Votre ID unique',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #F7F4EF;">
        <div style="background: #1A1A1A; padding: 32px; text-align: center;">
          <h1 style="color: #F7F4EF; font-size: 28px; letter-spacing: 6px; margin: 0;">LAMS</h1>
          <p style="color: #C9A96E; font-size: 12px; letter-spacing: 3px; margin: 8px 0 0 0;">BOUTIQUE</p>
        </div>
        <div style="padding: 40px 32px;">
          <h2 style="color: #1A1A1A; font-size: 22px;">Bienvenue, ${name} !</h2>
          <p style="color: #555; line-height: 1.7;">Votre compte LAMS a été créé avec succès. Voici votre identifiant unique :</p>
          <div style="background: #1A1A1A; color: #C9A96E; padding: 20px; text-align: center; border-radius: 4px; margin: 24px 0;">
            <p style="font-size: 12px; color: #888; margin: 0 0 8px 0; letter-spacing: 2px;">VOTRE ID UNIQUE</p>
            <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px; margin: 0;">${uniqueId}</p>
          </div>
          <p style="color: #555; line-height: 1.7;">Vous pouvez vous connecter avec cet ID ou avec votre email et mot de passe.</p>
          <div style="margin: 32px 0; text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/login"
               style="background: #1A1A1A; color: #F7F4EF; padding: 14px 32px; text-decoration: none; font-size: 13px; letter-spacing: 2px; display: inline-block;">
              SE CONNECTER
            </a>
          </div>
        </div>
        <div style="background: #1A1A1A; padding: 20px; text-align: center;">
          <p style="color: #888; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} LAMS Boutique. Tous droits réservés.</p>
        </div>
      </div>
    `,
  })
}

export async function sendOrderConfirmation(
  email: string,
  name: string,
  orderId: string,
  items: Array<{ name: string; quantity: number; price: number; color?: string; size?: string }>,
  total: number
) {
  const itemsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #E8E3DB; color: #1A1A1A;">
          ${item.name}
          ${item.color ? `<span style="color: #888;"> · ${item.color}</span>` : ''}
          ${item.size ? `<span style="color: #888;"> · ${item.size}</span>` : ''}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #E8E3DB; text-align: center; color: #555;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #E8E3DB; text-align: right; color: #1A1A1A;">${(item.price * item.quantity).toLocaleString()} FCFA</td>
      </tr>
    `
    )
    .join('')

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'LAMS Boutique <noreply@lams.com>',
    to: email,
    subject: `LAMS – Confirmation de commande #${orderId.slice(-8).toUpperCase()}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #F7F4EF;">
        <div style="background: #1A1A1A; padding: 32px; text-align: center;">
          <h1 style="color: #F7F4EF; font-size: 28px; letter-spacing: 6px; margin: 0;">LAMS</h1>
          <p style="color: #C9A96E; font-size: 12px; letter-spacing: 3px; margin: 8px 0 0 0;">BOUTIQUE</p>
        </div>
        <div style="padding: 40px 32px;">
          <h2 style="color: #1A1A1A;">Merci pour votre commande, ${name} !</h2>
          <p style="color: #555; line-height: 1.7;">Votre commande a été reçue et est en cours de traitement.</p>
          <div style="background: #E8E3DB; padding: 16px; margin: 20px 0; border-left: 3px solid #1A1A1A;">
            <p style="margin: 0; font-size: 12px; color: #888; letter-spacing: 2px;">N° DE COMMANDE</p>
            <p style="margin: 4px 0 0 0; font-weight: bold; color: #1A1A1A; font-size: 16px;">#${orderId.slice(-8).toUpperCase()}</p>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
            <thead>
              <tr style="background: #1A1A1A;">
                <th style="padding: 12px; text-align: left; color: #F7F4EF; font-size: 11px; letter-spacing: 2px;">ARTICLE</th>
                <th style="padding: 12px; text-align: center; color: #F7F4EF; font-size: 11px; letter-spacing: 2px;">QTÉ</th>
                <th style="padding: 12px; text-align: right; color: #F7F4EF; font-size: 11px; letter-spacing: 2px;">PRIX</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding: 16px 12px; font-weight: bold; color: #1A1A1A; letter-spacing: 2px; font-size: 12px;">TOTAL</td>
                <td style="padding: 16px 12px; text-align: right; font-weight: bold; color: #1A1A1A; font-size: 18px;">${total.toLocaleString()} FCFA</td>
              </tr>
            </tfoot>
          </table>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders"
               style="background: #1A1A1A; color: #F7F4EF; padding: 14px 32px; text-decoration: none; font-size: 13px; letter-spacing: 2px; display: inline-block;">
              SUIVRE MA COMMANDE
            </a>
          </div>
        </div>
        <div style="background: #1A1A1A; padding: 20px; text-align: center;">
          <p style="color: #888; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} LAMS Boutique. Tous droits réservés.</p>
        </div>
      </div>
    `,
  })
}

export async function sendLowStockAlert(adminEmail: string, productName: string, stock: number) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'LAMS Boutique <noreply@lams.com>',
    to: adminEmail,
    subject: `⚠️ Stock faible – ${productName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1A1A1A; padding: 24px; text-align: center;">
          <h1 style="color: #F7F4EF; font-size: 24px; letter-spacing: 4px; margin: 0;">LAMS ADMIN</h1>
        </div>
        <div style="padding: 32px; background: #FFF9F0; border-left: 4px solid #C9A96E;">
          <h2 style="color: #1A1A1A;">Alerte Stock Faible</h2>
          <p style="color: #555;">Le produit <strong>${productName}</strong> n'a plus que <strong style="color: #C9A96E;">${stock} article(s)</strong> en stock.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/products"
             style="background: #1A1A1A; color: #fff; padding: 12px 24px; text-decoration: none; display: inline-block; margin-top: 16px;">
            GÉRER LE STOCK
          </a>
        </div>
      </div>
    `,
  })
}
