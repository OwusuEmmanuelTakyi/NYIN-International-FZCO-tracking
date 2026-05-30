import {
  Document, Page, Text, View, StyleSheet, Font
} from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#0B0B0B',
    padding: 0,
    fontFamily: 'Helvetica',
  },
  // ── HEADER ─────────────────────────────────────────
  header: {
    backgroundColor: '#141414',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
    padding: '28 40',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logoArea: {},
  logoText: {
    fontSize: 28,
    color: '#C9A646',
    letterSpacing: 6,
    fontFamily: 'Helvetica-Bold',
  },
  logoSub: {
    fontSize: 7,
    color: '#4B5563',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: 3,
  },
  logoLine: {
    width: 32,
    height: 1,
    backgroundColor: '#C9A646',
    marginTop: 8,
    opacity: 0.4,
  },
  invoiceLabel: {
    fontSize: 22,
    color: '#FFFFFF',
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
  },
  invoiceNumber: {
    fontSize: 11,
    color: '#C9A646',
    textAlign: 'right',
    marginTop: 4,
  },
  invoiceDate: {
    fontSize: 9,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 3,
  },
  // ── GOLD BAR ───────────────────────────────────────
  goldBar: {
    height: 2,
    backgroundColor: '#C9A646',
    opacity: 0.6,
  },
  // ── BODY ───────────────────────────────────────────
  body: {
    padding: '32 40',
  },
  // ── ADDRESSES ─────────────────────────────────────
  addressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  addressBlock: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 8,
    color: '#6B7280',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  addressName: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  addressText: {
    fontSize: 9,
    color: '#9CA3AF',
    lineHeight: 1.5,
  },
  // ── DETAILS ROW ────────────────────────────────────
  detailsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  detailBox: {
    flex: 1,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 6,
    padding: '10 14',
  },
  detailLabel: {
    fontSize: 7,
    color: '#6B7280',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 10,
    color: '#FFFFFF',
    fontFamily: 'Helvetica-Bold',
  },
  detailValueGold: {
    fontSize: 10,
    color: '#C9A646',
    fontFamily: 'Helvetica-Bold',
  },
  // ── TABLE ──────────────────────────────────────────
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
    paddingBottom: 8,
    marginBottom: 4,
  },
  tableHeaderCell: {
    fontSize: 7,
    color: '#6B7280',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontFamily: 'Helvetica-Bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
    paddingVertical: 10,
  },
  tableRowAlt: {
    backgroundColor: '#141414',
  },
  cellDesc:  { flex: 4, paddingRight: 8 },
  cellQty:   { flex: 1, textAlign: 'right' },
  cellPrice: { flex: 2, textAlign: 'right' },
  cellTotal: { flex: 2, textAlign: 'right' },
  cellText: {
    fontSize: 9,
    color: '#D1D5DB',
  },
  cellTextBold: {
    fontSize: 9,
    color: '#FFFFFF',
    fontFamily: 'Helvetica-Bold',
  },
  cellTextGold: {
    fontSize: 9,
    color: '#C9A646',
    fontFamily: 'Helvetica-Bold',
  },
  // ── TOTALS ─────────────────────────────────────────
  totalsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 28,
  },
  totalsBox: {
    width: 220,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 6,
    overflow: 'hidden',
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: '8 14',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  totalsRowFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: '12 14',
    backgroundColor: '#1A1A1A',
  },
  totalsLabel: {
    fontSize: 9,
    color: '#9CA3AF',
  },
  totalsValue: {
    fontSize: 9,
    color: '#FFFFFF',
    fontFamily: 'Helvetica-Bold',
  },
  totalsFinalLabel: {
    fontSize: 11,
    color: '#FFFFFF',
    fontFamily: 'Helvetica-Bold',
  },
  totalsFinalValue: {
    fontSize: 13,
    color: '#C9A646',
    fontFamily: 'Helvetica-Bold',
  },
  paidBadge: {
    backgroundColor: '#052e16',
    borderWidth: 1,
    borderColor: '#166534',
    borderRadius: 4,
    padding: '4 10',
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: '0 14 8 14',
  },
  paidText: {
    fontSize: 9,
    color: '#4ade80',
    fontFamily: 'Helvetica-Bold',
  },
  // ── NOTES ──────────────────────────────────────────
  notesBox: {
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderLeftWidth: 3,
    borderLeftColor: '#C9A646',
    borderRadius: 6,
    padding: '12 16',
    marginBottom: 28,
  },
  notesLabel: {
    fontSize: 7,
    color: '#6B7280',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  notesText: {
    fontSize: 9,
    color: '#9CA3AF',
    lineHeight: 1.6,
  },
  // ── FOOTER ─────────────────────────────────────────
  footer: {
    backgroundColor: '#141414',
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    padding: '16 40',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  footerLeft: {},
  footerText: {
    fontSize: 8,
    color: '#374151',
  },
  footerTextGold: {
    fontSize: 8,
    color: '#C9A646',
    marginBottom: 2,
  },
  thankYou: {
    fontSize: 9,
    color: '#6B7280',
    fontStyle: 'italic',
  },
})

export default function InvoicePDF({ invoice }) {
  const lineItems = invoice?.line_items ?? []
  const fmt = (n) =>
    n != null
      ? `$${parseFloat(n).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      : '—'

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoArea}>
            <Text style={styles.logoText}>NYIN</Text>
            <Text style={styles.logoSub}>International FZCO</Text>
            <View style={styles.logoLine} />
          </View>
          <View>
            <Text style={styles.invoiceLabel}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice?.invoice_number}</Text>
            {invoice?.created_at && (
              <Text style={styles.invoiceDate}>
                {new Date(invoice.created_at).toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric'
                })}
              </Text>
            )}
          </View>
        </View>

        {/* Gold accent bar */}
        <View style={styles.goldBar} />

        <View style={styles.body}>

          {/* From / To addresses */}
          <View style={styles.addressRow}>
            <View style={styles.addressBlock}>
              <Text style={styles.addressLabel}>From</Text>
              <Text style={styles.addressName}>NYIN International FZCO</Text>
              <Text style={styles.addressText}>Dubai, United Arab Emirates</Text>
              <Text style={styles.addressText}>Precious Metals Trading</Text>
              <Text style={styles.addressText}>Streaming & Royalties · Mining Advisory</Text>
            </View>
            <View style={styles.addressBlock}>
              <Text style={[styles.addressLabel, { textAlign: 'right' }]}>Bill To</Text>
              <Text style={[styles.addressName, { textAlign: 'right' }]}>
                {invoice?.profiles?.company_name ?? invoice?.profiles?.full_name ?? '—'}
              </Text>
              <Text style={[styles.addressText, { textAlign: 'right' }]}>
                {invoice?.profiles?.email ?? ''}
              </Text>
              {invoice?.profiles?.phone && (
                <Text style={[styles.addressText, { textAlign: 'right' }]}>
                  {invoice.profiles.phone}
                </Text>
              )}
            </View>
          </View>

          {/* Invoice details row */}
          <View style={styles.detailsRow}>
            <View style={styles.detailBox}>
              <Text style={styles.detailLabel}>Invoice No.</Text>
              <Text style={styles.detailValueGold}>{invoice?.invoice_number}</Text>
            </View>
            {invoice?.orders?.order_number && (
              <View style={styles.detailBox}>
                <Text style={styles.detailLabel}>Order Ref.</Text>
                <Text style={styles.detailValue}>{invoice.orders.order_number}</Text>
              </View>
            )}
            <View style={styles.detailBox}>
              <Text style={styles.detailLabel}>Currency</Text>
              <Text style={styles.detailValue}>{invoice?.currency ?? 'USD'}</Text>
            </View>
            {invoice?.due_date && (
              <View style={styles.detailBox}>
                <Text style={styles.detailLabel}>Due Date</Text>
                <Text style={[styles.detailValue,
                  invoice?.status === 'Overdue' ? { color: '#f87171' } : {}
                ]}>
                  {new Date(invoice.due_date).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric'
                  })}
                </Text>
              </View>
            )}
            <View style={styles.detailBox}>
              <Text style={styles.detailLabel}>Status</Text>
              <Text style={[styles.detailValue, {
                color: invoice?.status === 'Paid' ? '#4ade80'
                     : invoice?.status === 'Overdue' ? '#f87171'
                     : '#C9A646'
              }]}>
                {invoice?.status ?? '—'}
              </Text>
            </View>
          </View>

          {/* Line items table */}
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <View style={styles.cellDesc}>
                <Text style={styles.tableHeaderCell}>Description</Text>
              </View>
              <View style={styles.cellQty}>
                <Text style={[styles.tableHeaderCell, { textAlign: 'right' }]}>Qty</Text>
              </View>
              <View style={styles.cellPrice}>
                <Text style={[styles.tableHeaderCell, { textAlign: 'right' }]}>Unit Price</Text>
              </View>
              <View style={styles.cellTotal}>
                <Text style={[styles.tableHeaderCell, { textAlign: 'right' }]}>Total</Text>
              </View>
            </View>

            {lineItems.map((item, i) => (
              <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                <View style={styles.cellDesc}>
                  <Text style={styles.cellText}>{item.description}</Text>
                </View>
                <View style={styles.cellQty}>
                  <Text style={[styles.cellText, { textAlign: 'right' }]}>
                    {item.quantity}
                  </Text>
                </View>
                <View style={styles.cellPrice}>
                  <Text style={[styles.cellText, { textAlign: 'right' }]}>
                    {fmt(item.unit_price)}
                  </Text>
                </View>
                <View style={styles.cellTotal}>
                  <Text style={[styles.cellTextGold, { textAlign: 'right' }]}>
                    {fmt(item.total)}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Totals */}
          <View style={styles.totalsContainer}>
            <View style={styles.totalsBox}>
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Subtotal</Text>
                <Text style={styles.totalsValue}>{fmt(invoice?.subtotal)}</Text>
              </View>
              {invoice?.tax_rate > 0 && (
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>Tax ({invoice.tax_rate}%)</Text>
                  <Text style={styles.totalsValue}>{fmt(invoice?.tax_amount)}</Text>
                </View>
              )}
              <View style={styles.totalsRowFinal}>
                <Text style={styles.totalsFinalLabel}>
                  Total {invoice?.currency ?? 'USD'}
                </Text>
                <Text style={styles.totalsFinalValue}>
                  {fmt(invoice?.total_amount)}
                </Text>
              </View>
              {invoice?.status === 'Paid' && invoice?.paid_at && (
                <View style={styles.paidBadge}>
                  <Text style={styles.paidText}>✓ PAID</Text>
                  <Text style={styles.paidText}>
                    {new Date(invoice.paid_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric'
                    })}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Notes */}
          {invoice?.notes && (
            <View style={styles.notesBox}>
              <Text style={styles.notesLabel}>Notes & Payment Instructions</Text>
              <Text style={styles.notesText}>{invoice.notes}</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <Text style={styles.footerTextGold}>NYIN International FZCO</Text>
            <Text style={styles.footerText}>Dubai, United Arab Emirates</Text>
            <Text style={styles.footerText}>Precious Metals · Streaming · Mining Advisory</Text>
          </View>
          <Text style={styles.thankYou}>Thank you for your business.</Text>
        </View>

      </Page>
    </Document>
  )
}