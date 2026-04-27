import type { Order } from '@/types'
import { formatDate, getStatusLabel } from '@/lib/utils'

export async function downloadInvoicePDF(order: Order) {
  // Dynamic import so jsPDF is only loaded client-side
  const { jsPDF } = await import('jspdf')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const W = 210
  const margin = 18
  const contentW = W - margin * 2
  let y = 0

  // ── Palette ──
  const dark = [26, 26, 26] as const        // #1A1A1A
  const gold = [201, 169, 110] as const     // #C9A96E
  const cream = [247, 244, 239] as const    // #F7F4EF
  const gray = [136, 136, 136] as const
  const lightgray = [212, 207, 200] as const
  const white = [255, 255, 255] as const

  // ── Helper: setRGB ──
  const setFill = (r: number, g: number, b: number) => doc.setFillColor(r, g, b)
  const setDraw = (r: number, g: number, b: number) => doc.setDrawColor(r, g, b)
  const setTxt  = (r: number, g: number, b: number) => doc.setTextColor(r, g, b)

  // ══════════════════════════════════════════
  // HEADER BLOCK
  // ══════════════════════════════════════════
  setFill(...dark)
  doc.rect(0, 0, W, 48, 'F')

  // Brand name
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  setTxt(...cream)
  doc.text('LAMS', margin, 22)

  // Boutique sub-label
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  setTxt(...gold)
  doc.text('B O U T I Q U E', margin, 30)

  // Gold accent line
  setFill(...gold)
  doc.rect(margin, 35, 24, 0.8, 'F')

  // Right side: FACTURE label
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  setTxt(...cream)
  doc.text('FACTURE', W - margin, 22, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  setTxt(...gold)
  doc.text(`#${order.id.slice(-8).toUpperCase()}`, W - margin, 30, { align: 'right' })

  y = 58

  // ══════════════════════════════════════════
  // INFO BOXES (2 columns)
  // ══════════════════════════════════════════
  const boxH = 32
  const boxW = (contentW - 6) / 2

  // Left box – Order info
  setFill(...cream)
  doc.rect(margin, y, boxW, boxH, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  setTxt(...gray)
  doc.text('INFORMATIONS COMMANDE', margin + 5, y + 8)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  setTxt(...dark)
  doc.text(`N° : #${order.id.slice(-8).toUpperCase()}`, margin + 5, y + 16)
  doc.text(`Date : ${formatDate(order.createdAt)}`, margin + 5, y + 22)
  doc.text(`Statut : ${getStatusLabel(order.status)}`, margin + 5, y + 28)

  // Right box – Payment info
  const rx = margin + boxW + 6
  setFill(...cream)
  doc.rect(rx, y, boxW, boxH, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  setTxt(...gray)
  doc.text('PAIEMENT', rx + 5, y + 8)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  setTxt(...dark)
  doc.text(`Méthode : ${order.paymentMethod}`, rx + 5, y + 16)

  const payLabel = order.paymentStatus === 'PAID' ? 'Payé' : order.paymentStatus === 'FAILED' ? 'Échoué' : 'En attente'
  const payColor: [number,number,number] = order.paymentStatus === 'PAID' ? [34,197,94] : order.paymentStatus === 'FAILED' ? [239,68,68] : [245,158,11]
  setTxt(...payColor)
  doc.text(`Statut : ${payLabel}`, rx + 5, y + 22)
  setTxt(...dark)
  if (order.paymentRef) doc.text(`Réf : ${order.paymentRef}`, rx + 5, y + 28)

  y += boxH + 10

  // ══════════════════════════════════════════
  // CLIENT INFO (if address)
  // ══════════════════════════════════════════
  if (order.deliveryAddress || order.user?.name) {
    setFill(...cream)
    doc.rect(margin, y, contentW, 16, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    setTxt(...gray)
    doc.text('CLIENT', margin + 5, y + 6)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    setTxt(...dark)
    const clientLine = [order.user?.name, order.deliveryAddress].filter(Boolean).join('  ·  ')
    const clientLines = doc.splitTextToSize(clientLine, contentW - 10)
    doc.text(clientLines[0], margin + 5, y + 13)
    y += 24
  }

  // ══════════════════════════════════════════
  // TABLE HEADER
  // ══════════════════════════════════════════
  setFill(...dark)
  doc.rect(margin, y, contentW, 9, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  setTxt(...cream)

  doc.text('ARTICLE', margin + 5, y + 6)
  doc.text('QTÉ', margin + contentW * 0.60, y + 6, { align: 'center' })
  doc.text('P.U.', margin + contentW * 0.75, y + 6, { align: 'center' })
  doc.text('TOTAL', margin + contentW - 4, y + 6, { align: 'right' })

  y += 9

  // ══════════════════════════════════════════
  // TABLE ROWS
  // ══════════════════════════════════════════
  // Column x positions
  const colArticleX = margin + 5
  const colArticleMaxW = contentW * 0.52  // article column width (mm)
  const colQtyX = margin + contentW * 0.60
  const colPuX  = margin + contentW * 0.75
  const colTotX = margin + contentW - 4

  order.items.forEach((item, idx) => {
    const rowH = 13
    if (idx % 2 === 0) {
      setFill(250, 248, 245)
      doc.rect(margin, y, contentW, rowH, 'F')
    } else {
      setFill(...white)
      doc.rect(margin, y, contentW, rowH, 'F')
    }

    // Product name — truncate to column width
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    setTxt(...dark)
    const nameLines = doc.splitTextToSize(item.name, colArticleMaxW)
    doc.text(nameLines[0], colArticleX, y + 6.5)

    if (item.color || item.size) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      setTxt(...gray)
      const variant = [item.color && `${item.color}`, item.size && `T.${item.size}`].filter(Boolean).join(' · ')
      const vLines = doc.splitTextToSize(variant, colArticleMaxW)
      doc.text(vLines[0], colArticleX, y + 11)
    }

    // Qty
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    setTxt(...dark)
    doc.text(String(item.quantity), colQtyX, y + 7.5, { align: 'center' })

    // Unit price — short format
    const puText = `${item.price.toLocaleString('fr')} F`
    doc.text(puText, colPuX, y + 7.5, { align: 'center' })

    // Line total
    doc.setFont('helvetica', 'bold')
    doc.text(`${(item.price * item.quantity).toLocaleString('fr')} F`, colTotX, y + 7.5, { align: 'right' })

    y += rowH
  })

  // ══════════════════════════════════════════
  // TOTAL ROW
  // ══════════════════════════════════════════
  setFill(...dark)
  doc.rect(margin, y, contentW, 12, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  setTxt(...cream)
  doc.text('TOTAL', margin + 5, y + 8)

  doc.setFontSize(12)
  setTxt(...gold)
  doc.text(`${order.total.toLocaleString()} FCFA`, margin + contentW - 5, y + 8.5, { align: 'right' })

  y += 20

  // ══════════════════════════════════════════
  // NOTE
  // ══════════════════════════════════════════
  if (order.note) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    setTxt(...gray)
    doc.text('NOTE', margin, y)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    setTxt(...dark)
    doc.text(order.note, margin, y + 6)
    y += 16
  }

  // ══════════════════════════════════════════
  // FOOTER
  // ══════════════════════════════════════════
  const footerY = 282
  setFill(...dark)
  doc.rect(0, footerY - 2, W, 20, 'F')

  // Gold divider
  setFill(...gold)
  doc.rect(0, footerY - 2, W, 0.6, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  setTxt(...cream)
  doc.text('LAMS', W / 2, footerY + 6, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  setTxt(...gray)
  doc.text('Merci pour votre confiance  ·  www.lams.com', W / 2, footerY + 12, { align: 'center' })

  // Save
  doc.save(`facture-LAMS-${order.id.slice(-8).toUpperCase()}.pdf`)
}
