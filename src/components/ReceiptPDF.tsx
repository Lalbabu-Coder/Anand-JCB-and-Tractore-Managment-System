/* eslint-disable jsx-a11y/alt-text */
import React from "react";
import { Document, Page, Text, View, StyleSheet, Image, Font } from "@react-pdf/renderer";

// Register custom fonts (optional, using standard Helvetica for simplicity but styled well)
const primaryColor = "#8b5cf6"; // Violet 500
const secondaryColor = "#1e293b"; // Slate 800
const lightBg = "#f8fafc";
const borderColor = "#e2e8f0";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 40,
    backgroundColor: "#ffffff",
    color: "#334155",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  brandSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoPlaceholder: {
    width: 40,
    height: 40,
    backgroundColor: primaryColor,
    borderRadius: 8,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  companyName: {
    fontSize: 22,
    fontWeight: "bold",
    color: secondaryColor,
    letterSpacing: -0.5,
  },
  companySub: {
    fontSize: 9,
    color: "#64748b",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  receiptBadge: {
    backgroundColor: `${primaryColor}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: `${primaryColor}30`,
  },
  receiptBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: primaryColor,
    letterSpacing: 1.5,
  },
  metaContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: lightBg,
    borderRadius: 8,
    padding: 15,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: borderColor,
  },
  metaCol: {
    width: "48%",
  },
  sectionTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  metaLabel: {
    width: 60,
    fontSize: 9,
    color: "#64748b",
  },
  metaValue: {
    flex: 1,
    fontSize: 9,
    fontWeight: "bold",
    color: secondaryColor,
  },
  table: {
    flexDirection: "column",
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: secondaryColor,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginBottom: 4,
  },
  tableHeaderCell: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: borderColor,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  tableRowStripe: {
    backgroundColor: "#fcfcfd",
  },
  tableCell: {
    color: secondaryColor,
    fontSize: 9,
  },
  tableCellDesc: {
    fontWeight: "bold",
    color: secondaryColor,
    fontSize: 10,
  },
  tableCellSubDesc: {
    fontSize: 8,
    color: "#64748b",
    marginTop: 2,
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  paymentQrCol: {
    width: "35%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: lightBg,
    borderWidth: 1,
    borderColor: borderColor,
    borderRadius: 8,
    padding: 15,
  },
  qrImage: {
    width: 100,
    height: 100,
    marginBottom: 8,
  },
  qrLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: primaryColor,
  },
  totalsCol: {
    width: "55%",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: borderColor,
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    backgroundColor: primaryColor,
    borderRadius: 6,
    marginTop: 10,
    paddingHorizontal: 12,
  },
  totalLabel: {
    fontSize: 9,
    color: "#64748b",
    fontWeight: "bold",
  },
  totalVal: {
    fontSize: 9,
    fontWeight: "bold",
    color: secondaryColor,
  },
  grandTotalLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#ffffff",
  },
  grandTotalVal: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#ffffff",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: borderColor,
    paddingTop: 15,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 8,
    color: "#94a3b8",
  },
  footerHighlight: {
    color: primaryColor,
    fontWeight: "bold",
  }
});

export interface ReceiptPDFProps {
  receiptId: string;
  type: "JCB" | "TRACTOR";
  customer: {
    name: string;
    mobile: string;
    village: string;
    address?: string | null;
  };
  workDetails: {
    date: string;
    operatorName: string;
    notes?: string | null;
    
    // JCB specific
    totalHours?: number;
    ratePerHour?: number;
    dieselCost?: number;
    workType?: string;
    pricingMethod?: string;
    tripCount?: number;
    ratePerTrip?: number;
    
    // Tractor specific (Array of operations)
    operations?: any[];
    
    extraCharges?: {
      driverCharge?: number | null;
      helperCharge?: number | null;
      foodExpense?: number | null;
      otherExpense?: number | null;
    };
    
    // General totals
    totalAmount: number;
    advancePaid: number;
    remainingBalance: number;
  };
  qrCodeDataUrl?: string; // Data URL for the payment QR Code
}

export const ReceiptPDF: React.FC<ReceiptPDFProps> = ({
  receiptId,
  type,
  customer,
  workDetails,
  qrCodeDataUrl,
}) => {
  const extraChargesTotal = (workDetails.extraCharges?.driverCharge || 0) + 
                            (workDetails.extraCharges?.helperCharge || 0) + 
                            (workDetails.extraCharges?.foodExpense || 0) + 
                            (workDetails.extraCharges?.otherExpense || 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandSection}>
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoText}>A</Text>
            </View>
            <View>
              <Text style={styles.companyName}>Anand JCB & Tractor</Text>
              <Text style={styles.companySub}>Professional Work Services</Text>
            </View>
          </View>
          <View style={styles.receiptBadge}>
            <Text style={styles.receiptBadgeText}>INVOICE #{receiptId}</Text>
          </View>
        </View>

        {/* Metadata Details */}
        <View style={styles.metaContainer}>
          <View style={styles.metaCol}>
            <Text style={styles.sectionTitle}>Billed To</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Name:</Text>
              <Text style={styles.metaValue}>{customer.name}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Mobile:</Text>
              <Text style={styles.metaValue}>{customer.mobile}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Location:</Text>
              <Text style={styles.metaValue}>{customer.village}{customer.address ? `, ${customer.address}` : ''}</Text>
            </View>
          </View>
          
          <View style={{ width: 1, backgroundColor: borderColor }} />
          
          <View style={styles.metaCol}>
            <Text style={styles.sectionTitle}>Work Details</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Date:</Text>
              <Text style={styles.metaValue}>{workDetails.date}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Operator:</Text>
              <Text style={styles.metaValue}>{workDetails.operatorName}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Machine:</Text>
              <Text style={styles.metaValue}>{type === "JCB" ? "JCB Excavator" : "Tractor"}</Text>
            </View>
          </View>
        </View>

        {/* Work Breakdown Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: "40%" }]}>Description</Text>
            <Text style={[styles.tableHeaderCell, { width: "15%", textAlign: "center" }]}>Passes</Text>
            <Text style={[styles.tableHeaderCell, { width: "15%", textAlign: "right" }]}>Qty / Area</Text>
            <Text style={[styles.tableHeaderCell, { width: "15%", textAlign: "right" }]}>Rate (₹)</Text>
            <Text style={[styles.tableHeaderCell, { width: "15%", textAlign: "right" }]}>Amount (₹)</Text>
          </View>

          {type === "JCB" ? (
            <View style={styles.tableRow}>
              <View style={{ width: "40%" }}>
                <Text style={styles.tableCellDesc}>
                  {workDetails.workType === "TALI_LOADING"
                    ? "JCB Tali Loading (ट्रॉली लोडिंग)"
                    : workDetails.workType === "TRACK_LOADING"
                    ? "JCB Track Loading (ट्रक लोडिंग)"
                    : "JCB Excavation Work (खुदाई)"}
                </Text>
              </View>
              <Text style={[styles.tableCell, { width: "15%", textAlign: "center" }]}>-</Text>
              {workDetails.pricingMethod === "TRIP" ? (
                <>
                  <Text style={[styles.tableCell, { width: "15%", textAlign: "right" }]}>{`${workDetails.tripCount || 0} Trips`}</Text>
                  <Text style={[styles.tableCell, { width: "15%", textAlign: "right" }]}>{(workDetails.ratePerTrip || 0).toFixed(2)}</Text>
                  <Text style={[styles.tableCell, { width: "15%", textAlign: "right", fontWeight: "bold" }]}>
                    {((workDetails.tripCount || 0) * (workDetails.ratePerTrip || 0)).toFixed(2)}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={[styles.tableCell, { width: "15%", textAlign: "right" }]}>{`${workDetails.totalHours || 0} Hrs`}</Text>
                  <Text style={[styles.tableCell, { width: "15%", textAlign: "right" }]}>{(workDetails.ratePerHour || 0).toFixed(2)}</Text>
                  <Text style={[styles.tableCell, { width: "15%", textAlign: "right", fontWeight: "bold" }]}>
                    {((workDetails.totalHours || 0) * (workDetails.ratePerHour || 0)).toFixed(2)}
                  </Text>
                </>
              )}
            </View>
          ) : (
            <>
              {workDetails.operations?.map((op, idx) => {
                const isTransport = ["SOIL_FILLING", "SAND_TRANSPORT", "BRICK_TRANSPORT", "WATER_TANK_SUPPLY", "TROLLEY_TRANSPORT", "TROLLEY"].includes(op.workType);
                const isStripe = idx % 2 === 1;
                
                if (op.pricingMethod === "FIXED_TOTAL") {
                  return (
                    <View key={idx} style={[styles.tableRow, isStripe ? styles.tableRowStripe : {}]}>
                      <View style={{ width: "40%" }}>
                        <Text style={styles.tableCellDesc}>{op.workType?.replace(/_/g, " ")}</Text>
                        <Text style={styles.tableCellSubDesc}>Fixed Job Amount</Text>
                      </View>
                      <Text style={[styles.tableCell, { width: "15%", textAlign: "center" }]}>-</Text>
                      <Text style={[styles.tableCell, { width: "15%", textAlign: "right" }]}>-</Text>
                      <Text style={[styles.tableCell, { width: "15%", textAlign: "right" }]}>-</Text>
                      <Text style={[styles.tableCell, { width: "15%", textAlign: "right", fontWeight: "bold" }]}>
                        {Number(op.amount || op.fixedTotalAmount || 0).toFixed(2)}
                      </Text>
                    </View>
                  );
                }

                return (
                  <View key={idx} style={[styles.tableRow, isStripe ? styles.tableRowStripe : {}]}>
                    <View style={{ width: "40%" }}>
                      <Text style={styles.tableCellDesc}>{op.workType?.replace(/_/g, " ")}</Text>
                    </View>
                    <Text style={[styles.tableCell, { width: "15%", textAlign: "center" }]}>
                      {op.numberOfPasses ? `${op.numberOfPasses}x` : "-"}
                    </Text>
                    
                    {isTransport ? (
                      <>
                        <Text style={[styles.tableCell, { width: "15%", textAlign: "right" }]}>{`${op.tripCount} Trips`}</Text>
                        <Text style={[styles.tableCell, { width: "15%", textAlign: "right" }]}>{op.ratePerTrip?.toFixed(2)}</Text>
                        <Text style={[styles.tableCell, { width: "15%", textAlign: "right", fontWeight: "bold" }]}>
                          {((op.tripCount || 0) * (op.ratePerTrip || 0)).toFixed(2)}
                        </Text>
                      </>
                    ) : (
                      <>
                        <Text style={[styles.tableCell, { width: "15%", textAlign: "right" }]}>{`${op.area} ${op.landUnit}`}</Text>
                        <Text style={[styles.tableCell, { width: "15%", textAlign: "right" }]}>{op.ratePerArea?.toFixed(2)}</Text>
                        <Text style={[styles.tableCell, { width: "15%", textAlign: "right", fontWeight: "bold" }]}>
                          {((op.area || 0) * (op.ratePerArea || 0)).toFixed(2)}
                        </Text>
                      </>
                    )}
                  </View>
                );
              })}
            </>
          )}

          {type === "JCB" && (workDetails.dieselCost || 0) > 0 ? (
            <View style={styles.tableRow}>
              <View style={{ width: "40%" }}>
                <Text style={styles.tableCellDesc}>Diesel Cost</Text>
                <Text style={styles.tableCellSubDesc}>Deducted from balance</Text>
              </View>
              <Text style={[styles.tableCell, { width: "15%", textAlign: "center" }]}>-</Text>
              <Text style={[styles.tableCell, { width: "15%", textAlign: "right" }]}>1</Text>
              <Text style={[styles.tableCell, { width: "15%", textAlign: "right" }]}>{workDetails.dieselCost?.toFixed(2)}</Text>
              <Text style={[styles.tableCell, { width: "15%", textAlign: "right", fontWeight: "bold" }]}>
                {workDetails.dieselCost?.toFixed(2)}
              </Text>
            </View>
          ) : null}

          {extraChargesTotal > 0 ? (
            <View style={styles.tableRow}>
              <View style={{ width: "40%" }}>
                <Text style={styles.tableCellDesc}>Extra Charges</Text>
                <Text style={styles.tableCellSubDesc}>Driver, Food, Helper, etc.</Text>
              </View>
              <Text style={[styles.tableCell, { width: "15%", textAlign: "center" }]}>-</Text>
              <Text style={[styles.tableCell, { width: "15%", textAlign: "right" }]}>-</Text>
              <Text style={[styles.tableCell, { width: "15%", textAlign: "right" }]}>-</Text>
              <Text style={[styles.tableCell, { width: "15%", textAlign: "right", fontWeight: "bold" }]}>
                {extraChargesTotal.toFixed(2)}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Summary (Totals + UPI QR Code) */}
        <View style={styles.summaryContainer}>
          <View style={styles.paymentQrCol}>
            {qrCodeDataUrl ? (
              <>
                <Image src={qrCodeDataUrl} style={styles.qrImage} />
                <Text style={styles.qrLabel}>SCAN TO PAY</Text>
              </>
            ) : (
              <View style={{ width: 100, height: 100, backgroundColor: "#f1f5f9", justifyContent: "center", alignItems: "center", marginBottom: 8, borderRadius: 8 }}>
                <Text style={{ fontSize: 7, color: "#94a3b8" }}>QR UNAVAILABLE</Text>
              </View>
            )}
          </View>

          <View style={styles.totalsCol}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal Amount</Text>
              <Text style={styles.totalVal}>₹{workDetails.totalAmount.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Advance Received</Text>
              <Text style={styles.totalVal}>- ₹{workDetails.advancePaid.toFixed(2)}</Text>
            </View>
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Balance Due</Text>
              <Text style={styles.grandTotalVal}>₹{workDetails.remainingBalance.toFixed(2)}</Text>
            </View>

            {workDetails.notes ? (
              <View style={{ marginTop: 15, padding: 10, backgroundColor: lightBg, borderRadius: 6, borderWidth: 1, borderColor: borderColor }}>
                <Text style={{ fontSize: 8, color: primaryColor, fontWeight: "bold", textTransform: "uppercase", marginBottom: 3 }}>Remarks</Text>
                <Text style={{ fontSize: 9, color: secondaryColor, lineHeight: 1.4 }}>{workDetails.notes}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Thank you for choosing <Text style={styles.footerHighlight}>Anand JCB & Tractor</Text>!
          </Text>
          <Text style={styles.footerText}>This is a computer-generated invoice.</Text>
        </View>
      </Page>
    </Document>
  );
};
