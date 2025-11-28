// InvoiceApp.jsx
import React, { useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import styles from "./InvoiceApp.module.css";

const InvoiceApp = () => {
  const invoiceRef = useRef(null);
  const [isPreview, setIsPreview] = useState(false);
  const [invoiceType, setInvoiceType] = useState("buyer"); // 'buyer' or 'seller'

  // Seller Info
  const [sellerName, setSellerName] = useState("K P BROTHERS");
  const [sellerAddress, setSellerAddress] = useState(
    "LBS MARKET, HAVERI- 581110, KARNATAKA"
  );
  const [sellerGSTIN, setSellerGSTIN] = useState("");
  const [sellerState, setSellerState] = useState("Karnataka, Code - 29");

  // Buyer Info
  const [buyerName, setBuyerName] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");
  const [buyerGSTIN, setBuyerGSTIN] = useState("");
  const [buyerState, setBuyerState] = useState("");

  // Invoice Details
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Line Items
  const [items, setItems] = useState([
    {
      slno: 1,
      goodsName: "",
      hsnsac: "",
      gstRate: 5,
      quantity: "",
      rate: "",
      per: "PCS",
      amount: 0,
    },
  ]);

  // GST Breakdown
  const [gstBreakdown, setGstBreakdown] = useState([
    { label: "Output CGST@ 2.5%", rate: 2.5, amount: 0 },
    { label: "Output SGST@ 2.5%", rate: 2.5, amount: 0 },
    { label: "Output CGST@9 %", rate: 9, amount: 0 },
    { label: "Output SGST@9 %", rate: 9, amount: 0 },
  ]);

  // Calculate item amount
  const calculateItemAmount = (quantity, rate) => {
    return (parseFloat(quantity) || 0) * (parseFloat(rate) || 0);
  };

  // Add new item
  const addItem = () => {
    setItems([
      ...items,
      {
        slno: items.length + 1,
        goodsName: "",
        hsnsac: "",
        gstRate: 5,
        quantity: "",
        rate: "",
        per: "PCS",
        amount: 0,
      },
    ]);
  };

  // Remove item
  const removeItem = (index) => {
    if (items.length > 1) {
      const updatedItems = items.filter((_, i) => i !== index);
      setItems(updatedItems.map((item, i) => ({ ...item, slno: i + 1 })));
    }
  };

  // Update item
  const updateItem = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index][field] = value;

    if (field === "quantity" || field === "rate") {
      updatedItems[index].amount = calculateItemAmount(
        updatedItems[index].quantity,
        updatedItems[index].rate
      );
    }

    setItems(updatedItems);
  };

  // Calculate subtotal
  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  // Calculate total GST amount for each rate
  const calculateGSTForRate = (rate) => {
    return items
      .filter((item) => item.gstRate === rate)
      .reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  // Update GST breakdown dynamically
  const updateGSTBreakdown = () => {
    const subtotal = calculateSubtotal();
    const cgst25Base = calculateGSTForRate(5);
    const cgst9Base = calculateGSTForRate(18);

    return [
      {
        label: "Output CGST@ 2.5%",
        rate: 2.5,
        amount: (cgst25Base * 2.5) / 100,
      },
      {
        label: "Output SGST@ 2.5%",
        rate: 2.5,
        amount: (cgst25Base * 2.5) / 100,
      },
      { label: "Output CGST@9 %", rate: 9, amount: (cgst9Base * 9) / 100 },
      { label: "Output SGST@9 %", rate: 9, amount: (cgst9Base * 9) / 100 },
    ];
  };

  // Calculate total GST
  const calculateTotalGST = () => {
    const breakdown = updateGSTBreakdown();
    return breakdown.reduce((sum, item) => sum + item.amount, 0);
  };

  // Calculate round off
  const calculateRoundOff = () => {
    const total = calculateSubtotal() + calculateTotalGST();
    return Math.round(total) - total;
  };

  // Calculate grand total
  const calculateGrandTotal = () => {
    return Math.round(calculateSubtotal() + calculateTotalGST());
  };

  // Convert number to words (Indian style)
  const numberToWords = (num) => {
    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
    ];
    const teens = [
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];
    const tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];

    if (num === 0) return "Zero";

    const convertBelowThousand = (n) => {
      if (n === 0) return "";
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100)
        return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
      return (
        ones[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 ? " " + convertBelowThousand(n % 100) : "")
      );
    };

    if (num < 1000) return convertBelowThousand(num);
    if (num < 100000) {
      return (
        convertBelowThousand(Math.floor(num / 1000)) +
        " Thousand" +
        (num % 1000 ? " " + convertBelowThousand(num % 1000) : "")
      );
    }
    if (num < 10000000) {
      return (
        convertBelowThousand(Math.floor(num / 100000)) +
        " Lakh" +
        (num % 100000 >= 1000
          ? " " +
            convertBelowThousand(Math.floor((num % 100000) / 1000)) +
            " Thousand"
          : "") +
        (num % 1000 ? " " + convertBelowThousand(num % 1000) : "")
      );
    }
    return "Number too large";
  };

  // Download PDF
  const downloadPDF = async () => {
    const element = invoiceRef.current;
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Invoice-${invoiceNo || "draft"}.pdf`);
  };

  const gstBreakdownData = updateGSTBreakdown();

  return (
    <div className={styles.appContainer}>
      {!isPreview ? (
        // Edit Mode
        <div className={styles.editContainer}>
          <h1 className={styles.appTitle}>GST Invoice Generator</h1>

          {/* Invoice Type Selection */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Invoice Type</label>
            <select
              value={invoiceType}
              onChange={(e) => setInvoiceType(e.target.value)}
              className={styles.select}
            >
              <option value="buyer">For Buyer</option>
              <option value="seller">For Seller</option>
            </select>
          </div>

          {/* Invoice Details */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Invoice Details</h2>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Invoice No.</label>
                <input
                  type="text"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  className={styles.input}
                  placeholder="4527"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Date</label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className={styles.input}
                />
              </div>
            </div>
          </div>

          {/* Seller Info */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Seller Information</h2>
            <div className={styles.formGroup}>
              <label className={styles.label}>Name</label>
              <input
                type="text"
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Address</label>
              <textarea
                value={sellerAddress}
                onChange={(e) => setSellerAddress(e.target.value)}
                className={styles.textarea}
                rows="2"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>GSTIN/UIN</label>
              <input
                type="text"
                value={sellerGSTIN}
                onChange={(e) => setSellerGSTIN(e.target.value)}
                className={styles.input}
                placeholder="29ABCFS1902J1ZS"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>State</label>
              <input
                type="text"
                value={sellerState}
                onChange={(e) => setSellerState(e.target.value)}
                className={styles.input}
              />
            </div>
          </div>

          {/* Buyer Info */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Buyer Information</h2>
            <div className={styles.formGroup}>
              <label className={styles.label}>Name</label>
              <input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Address</label>
              <textarea
                value={buyerAddress}
                onChange={(e) => setBuyerAddress(e.target.value)}
                className={styles.textarea}
                rows="2"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>GSTIN/UIN</label>
              <input
                type="text"
                value={buyerGSTIN}
                onChange={(e) => setBuyerGSTIN(e.target.value)}
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>State</label>
              <input
                type="text"
                value={buyerState}
                onChange={(e) => setBuyerState(e.target.value)}
                className={styles.input}
              />
            </div>
          </div>

          {/* Items Section */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Items</h2>
            {items.map((item, index) => (
              <div key={index} className={styles.itemCard}>
                <div className={styles.itemHeader}>
                  <span className={styles.itemNumber}>Item {item.slno}</span>
                  {items.length > 1 && (
                    <button
                      onClick={() => removeItem(index)}
                      className={styles.removeBtn}
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Goods Name</label>
                  <input
                    type="text"
                    value={item.goodsName}
                    onChange={(e) =>
                      updateItem(index, "goodsName", e.target.value)
                    }
                    className={styles.input}
                    placeholder="Product name"
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>HSN/SAC</label>
                    <input
                      type="text"
                      value={item.hsnsac}
                      onChange={(e) =>
                        updateItem(index, "hsnsac", e.target.value)
                      }
                      className={styles.input}
                      placeholder="34021020"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>GST Rate (%)</label>
                    <select
                      value={item.gstRate}
                      onChange={(e) =>
                        updateItem(index, "gstRate", parseInt(e.target.value))
                      }
                      className={styles.select}
                    >
                      <option value={5}>5%</option>
                      <option value={12}>12%</option>
                      <option value={18}>18%</option>
                      <option value={28}>28%</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Quantity</label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(index, "quantity", e.target.value)
                      }
                      className={styles.input}
                      placeholder="20"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Rate</label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.rate}
                      onChange={(e) =>
                        updateItem(index, "rate", e.target.value)
                      }
                      className={styles.input}
                      placeholder="48.89"
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Per</label>
                    <select
                      value={item.per}
                      onChange={(e) => updateItem(index, "per", e.target.value)}
                      className={styles.select}
                    >
                      <option value="PCS">PCS</option>
                      <option value="PET">PET</option>
                      <option value="SET">SET</option>
                      <option value="PKT">PKT</option>
                      <option value="KG">KG</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Amount</label>
                    <input
                      type="text"
                      value={item.amount.toFixed(2)}
                      className={styles.inputReadonly}
                      readOnly
                    />
                  </div>
                </div>
              </div>
            ))}

            <button onClick={addItem} className={styles.addBtn}>
              + Add Item
            </button>
          </div>

          {/* Summary */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Summary</h2>
            <div className={styles.summaryRow}>
              <span>Subtotal:</span>
              <span>₹ {calculateSubtotal().toFixed(2)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Total GST:</span>
              <span>₹ {calculateTotalGST().toFixed(2)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Round Off:</span>
              <span>₹ {calculateRoundOff().toFixed(2)}</span>
            </div>
            <div className={`${styles.summaryRow} ${styles.grandTotal}`}>
              <span>Grand Total:</span>
              <span>₹ {calculateGrandTotal().toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={() => setIsPreview(true)}
            className={styles.previewBtn}
          >
            Preview Invoice
          </button>
        </div>
      ) : (
        // Preview Mode
        <div className={styles.previewContainer}>
          <div className={styles.previewActions}>
            <button
              onClick={() => setIsPreview(false)}
              className={styles.backBtn}
            >
              ← Back to Edit
            </button>
            <button onClick={downloadPDF} className={styles.downloadBtn}>
              Download PDF
            </button>
          </div>

          {/* Invoice Preview - Exact replica */}
          <div ref={invoiceRef} className={styles.invoiceWrapper}>
            <div className={styles.invoice}>
              {/* Header */}
              <div className={styles.invoiceHeader}>
                <div className={styles.invoiceTitle}>GST INVOICE</div>
                <div className={styles.invoiceSubtitle}>
                  (DUPLICATE FOR {invoiceType.toUpperCase()})
                </div>
              </div>

              {/* Seller and Buyer Info */}
              <div className={styles.infoSection}>
                <div className={styles.infoRow}>
                  <div className={styles.infoCol}>
                    <div className={styles.infoLabel}>{sellerName}</div>
                    <div className={styles.infoText}>
                      {sellerAddress.split(",")[0]}
                    </div>
                    <div className={styles.infoText}>
                      GSTIN/UIN: {sellerGSTIN || "29ABCFS1902J1ZS"}
                    </div>
                    <div className={styles.infoText}>
                      State Name: {sellerState}
                    </div>
                    <div className={styles.infoText}>
                      E-Mail: {sellerName.toLowerCase().replace(" ", "")}
                      @gmail.com
                    </div>
                  </div>
                  <div className={styles.infoCol}>
                    <div className={styles.invoiceMetaRow}>
                      <span>Invoice No.</span>
                      <span>{invoiceNo}</span>
                    </div>
                    <div className={styles.invoiceMetaRow}>
                      <span>Dated</span>
                      <span>
                        {new Date(invoiceDate)
                          .toLocaleDateString("en-GB")
                          .replace(/\//g, "-")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.buyerSection}>
                  <div className={styles.infoLabel}>
                    {buyerName || "BUYER NAME"}
                  </div>
                  <div className={styles.infoText}>
                    {buyerAddress || "BUYER ADDRESS"}
                  </div>
                  <div className={styles.infoText}>
                    GSTIN/UIN: {buyerGSTIN || "N/A"}
                  </div>
                  <div className={styles.infoText}>
                    State Name: {buyerState || "State, Code - XX"}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <table className={styles.invoiceTable}>
                <thead>
                  <tr>
                    <th style={{ width: "5%" }}>
                      Sl
                      <br />
                      No
                    </th>
                    <th style={{ width: "30%" }}>Description of Goods</th>
                    <th style={{ width: "12%" }}>HSN/SAC</th>
                    <th style={{ width: "8%" }}>
                      GST
                      <br />
                      Rate
                    </th>
                    <th style={{ width: "10%" }}>Quantity</th>
                    <th style={{ width: "10%" }}>Rate</th>
                    <th style={{ width: "8%" }}>per</th>
                    <th style={{ width: "12%" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.slno}</td>
                      <td style={{ textAlign: "left", paddingLeft: "4px" }}>
                        {item.goodsName}
                      </td>
                      <td>{item.hsnsac}</td>
                      <td>{item.gstRate} %</td>
                      <td>
                        {item.quantity} {item.per}
                      </td>
                      <td>{parseFloat(item.rate).toFixed(2)}</td>
                      <td>{item.per}</td>
                      <td>{item.amount.toFixed(2)}</td>
                    </tr>
                  ))}

                  {/* Subtotal Row */}
                  <tr className={styles.subtotalRow}>
                    <td
                      colSpan="7"
                      style={{ textAlign: "right", paddingRight: "8px" }}
                    ></td>
                    <td>{calculateSubtotal().toFixed(2)}</td>
                  </tr>

                  {/* GST Breakdown */}
                  {gstBreakdownData.map(
                    (gst, index) =>
                      gst.amount > 0 && (
                        <tr key={index} className={styles.gstRow}>
                          <td
                            colSpan="6"
                            style={{ textAlign: "left", paddingLeft: "8px" }}
                          >
                            {gst.label}
                          </td>
                          <td>{gst.rate} %</td>
                          <td>{gst.amount.toFixed(2)}</td>
                        </tr>
                      )
                  )}

                  {/* Round Off */}
                  <tr className={styles.gstRow}>
                    <td
                      colSpan="7"
                      style={{ textAlign: "left", paddingLeft: "8px" }}
                    >
                      Round Off A/c
                    </td>
                    <td>{calculateRoundOff().toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Total Section */}
              <div className={styles.totalSection}>
                <div className={styles.totalRow}>
                  <span>Total</span>
                  <span>Rs. {calculateGrandTotal().toFixed(2)}</span>
                </div>
              </div>

              {/* Amount in Words */}
              <div className={styles.amountWords}>
                <div className={styles.wordsLabel}>
                  Amount Chargeable (in words)
                </div>
                <div className={styles.wordsText}>
                  Indian Rupees {numberToWords(calculateGrandTotal())} Only
                </div>
              </div>

              {/* Footer with For clause */}
              <div className={styles.invoiceFooter}>
                <div className={styles.forClause}>
                  <div className={styles.forText}>
                    for {sellerName.toUpperCase()}
                  </div>
                  <div className={styles.signatureSpace}></div>
                  <div className={styles.signatureLabel}>
                    Authorised Signatory
                  </div>
                </div>
              </div>

              {/* Computer Generated */}
              <div className={styles.computerGenerated}>
                This is a Computer Generated Invoice
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceApp;
