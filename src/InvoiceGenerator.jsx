// InvoiceGenerator.jsx
import React, { useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import styles from "./InvoiceGenerator.module.css";

const InvoiceGenerator = () => {
  const invoiceRef = useRef();

  // Default seller information
  const [sellerInfo] = useState({
    name: "K P BROTHERS",
    address: "LBS MARKET, HAVERI - 581110",
    location: "Karnataka",
    gstin: "29ABCFS1902J1ZK",
    code: "29",
  });

  // Invoice Type
  const [invoiceType, setInvoiceType] = useState("seller"); // 'seller' or 'buyer'

  // Buyer Information
  const [buyerInfo, setBuyerInfo] = useState({
    name: "",
    address: "",
    location: "",
    gstin: "",
    code: "",
  });

  // Invoice Details
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Items
  const [items, setItems] = useState([
    {
      slno: 1,
      goodsName: "",
      hsnSac: "",
      gstRate: 5,
      quantity: "",
      rate: "",
      per: "PET",
      amount: 0,
    },
  ]);

  // Dynamic GST Outputs
  const [gstOutputs, setGstOutputs] = useState([
    { name: "Output CGST", rate: 2.5, amount: 0 },
    { name: "Output SGST", rate: 2.5, amount: 0 },
  ]);

  // Signature
  const [signature, setSignature] = useState("");

  // Calculate item amount
  const calculateItemAmount = (item) => {
    const qty = parseFloat(item.quantity) || 0;
    const rate = parseFloat(item.rate) || 0;
    return qty * rate;
  };

  // Update item
  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    if (field === "quantity" || field === "rate") {
      newItems[index].amount = calculateItemAmount(newItems[index]);
    }
    setItems(newItems);
  };

  // Add new item
  const addItem = () => {
    setItems([
      ...items,
      {
        slno: items.length + 1,
        goodsName: "",
        hsnSac: "",
        gstRate: 5,
        quantity: "",
        rate: "",
        per: "PET",
        amount: 0,
      },
    ]);
  };

  // Remove item
  const removeItem = (index) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      newItems.forEach((item, i) => (item.slno = i + 1));
      setItems(newItems);
    }
  };

  // Calculate subtotal
  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  };

  // Update GST output amounts
  const updateGstOutputs = () => {
    const subtotal = calculateSubtotal();
    const newGstOutputs = gstOutputs.map((gst) => ({
      ...gst,
      amount: (subtotal * gst.rate) / 100,
    }));
    setGstOutputs(newGstOutputs);
  };

  // Add GST output
  const addGstOutput = () => {
    setGstOutputs([...gstOutputs, { name: "", rate: 0, amount: 0 }]);
  };

  // Update GST output
  const updateGstOutput = (index, field, value) => {
    const newGstOutputs = [...gstOutputs];
    newGstOutputs[index][field] =
      field === "rate" ? parseFloat(value) || 0 : value;
    if (field === "rate") {
      const subtotal = calculateSubtotal();
      newGstOutputs[index].amount =
        (subtotal * newGstOutputs[index].rate) / 100;
    }
    setGstOutputs(newGstOutputs);
  };

  // Remove GST output
  const removeGstOutput = (index) => {
    if (gstOutputs.length > 1) {
      setGstOutputs(gstOutputs.filter((_, i) => i !== index));
    }
  };

  // Calculate total GST
  const calculateTotalGst = () => {
    return gstOutputs.reduce(
      (sum, gst) => sum + (parseFloat(gst.amount) || 0),
      0
    );
  };

  // Calculate round off
  const calculateRoundOff = (total) => {
    return Math.round(total) - total;
  };

  // Calculate grand total
  const calculateGrandTotal = () => {
    const subtotal = calculateSubtotal();
    const totalGst = calculateTotalGst();
    const beforeRound = subtotal + totalGst;
    return Math.round(beforeRound);
  };

  // Convert number to words
  const numberToWords = (num) => {
    if (num === 0) return "Zero";

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

    const convertLessThanThousand = (n) => {
      if (n === 0) return "";
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100)
        return (
          tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "")
        );
      return (
        ones[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 !== 0 ? " " + convertLessThanThousand(n % 100) : "")
      );
    };

    if (num < 1000) return convertLessThanThousand(num);
    if (num < 100000) {
      return (
        convertLessThanThousand(Math.floor(num / 1000)) +
        " Thousand" +
        (num % 1000 !== 0 ? " " + convertLessThanThousand(num % 1000) : "")
      );
    }
    if (num < 10000000) {
      return (
        convertLessThanThousand(Math.floor(num / 100000)) +
        " Lakh" +
        (num % 100000 !== 0 ? " " + numberToWords(num % 100000) : "")
      );
    }
    return (
      convertLessThanThousand(Math.floor(num / 10000000)) +
      " Crore" +
      (num % 10000000 !== 0 ? " " + numberToWords(num % 10000000) : "")
    );
  };

  // Download PDF
  const downloadPDF = async () => {
    const element = invoiceRef.current;
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 0;

    pdf.addImage(
      imgData,
      "PNG",
      imgX,
      imgY,
      imgWidth * ratio,
      imgHeight * ratio
    );
    pdf.save(`invoice-${invoiceNo || "draft"}.pdf`);
  };

  React.useEffect(() => {
    updateGstOutputs();
  }, [items]);

  const subtotal = calculateSubtotal();
  const totalGst = calculateTotalGst();
  const beforeRound = subtotal + totalGst;
  const roundOff = calculateRoundOff(beforeRound);
  const grandTotal = calculateGrandTotal();

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <h1 className={styles.appTitle}>GST Invoice Generator</h1>

        {/* Invoice Type Selector */}
        <div className={styles.controlGroup}>
          <label className={styles.label}>Invoice For:</label>
          <select
            value={invoiceType}
            onChange={(e) => setInvoiceType(e.target.value)}
            className={styles.select}
          >
            <option value="seller">Seller</option>
            <option value="buyer">Buyer</option>
          </select>
        </div>

        {/* Buyer Information */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Buyer Information</h3>
          <input
            type="text"
            placeholder="Buyer Name"
            value={buyerInfo.name}
            onChange={(e) =>
              setBuyerInfo({ ...buyerInfo, name: e.target.value })
            }
            className={styles.input}
          />
          <input
            type="text"
            placeholder="Address"
            value={buyerInfo.address}
            onChange={(e) =>
              setBuyerInfo({ ...buyerInfo, address: e.target.value })
            }
            className={styles.input}
          />
          <input
            type="text"
            placeholder="Location"
            value={buyerInfo.location}
            onChange={(e) =>
              setBuyerInfo({ ...buyerInfo, location: e.target.value })
            }
            className={styles.input}
          />
          <input
            type="text"
            placeholder="GSTIN/UIN"
            value={buyerInfo.gstin}
            onChange={(e) =>
              setBuyerInfo({ ...buyerInfo, gstin: e.target.value })
            }
            className={styles.input}
          />
          <input
            type="text"
            placeholder="Code"
            value={buyerInfo.code}
            onChange={(e) =>
              setBuyerInfo({ ...buyerInfo, code: e.target.value })
            }
            className={styles.input}
          />
        </div>

        {/* Invoice Details */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Invoice Details</h3>
          <input
            type="text"
            placeholder="Invoice Number"
            value={invoiceNo}
            onChange={(e) => setInvoiceNo(e.target.value)}
            className={styles.input}
          />
          <input
            type="date"
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
            className={styles.input}
          />
        </div>

        {/* Items */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Items</h3>
          {items.map((item, index) => (
            <div key={index} className={styles.itemCard}>
              <div className={styles.itemHeader}>
                <span className={styles.itemNumber}>Item {item.slno}</span>
                {items.length > 1 && (
                  <button
                    onClick={() => removeItem(index)}
                    className={styles.removeBtn}
                  >
                    ✕
                  </button>
                )}
              </div>
              <input
                type="text"
                placeholder="Goods Name"
                value={item.goodsName}
                onChange={(e) => updateItem(index, "goodsName", e.target.value)}
                className={styles.input}
              />
              <input
                type="text"
                placeholder="HSN/SAC"
                value={item.hsnSac}
                onChange={(e) => updateItem(index, "hsnSac", e.target.value)}
                className={styles.input}
              />
              <input
                type="number"
                placeholder="GST Rate (%)"
                value={item.gstRate}
                onChange={(e) => updateItem(index, "gstRate", e.target.value)}
                className={styles.input}
              />
              <div className={styles.inputRow}>
                <input
                  type="number"
                  placeholder="Quantity"
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(index, "quantity", e.target.value)
                  }
                  className={styles.input}
                />
                <input
                  type="number"
                  placeholder="Rate"
                  value={item.rate}
                  onChange={(e) => updateItem(index, "rate", e.target.value)}
                  className={styles.input}
                />
              </div>
              <input
                type="text"
                placeholder="Per (e.g., PET, pcs)"
                value={item.per}
                onChange={(e) => updateItem(index, "per", e.target.value)}
                className={styles.input}
              />
              <div className={styles.amountDisplay}>
                Amount: ₹{item.amount.toFixed(2)}
              </div>
            </div>
          ))}
          <button onClick={addItem} className={styles.addBtn}>
            + Add Item
          </button>
        </div>

        {/* GST Outputs */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>GST Outputs</h3>
          {gstOutputs.map((gst, index) => (
            <div key={index} className={styles.gstCard}>
              <div className={styles.inputRow}>
                <input
                  type="text"
                  placeholder="GST Name (e.g., Output CGST)"
                  value={gst.name}
                  onChange={(e) =>
                    updateGstOutput(index, "name", e.target.value)
                  }
                  className={styles.input}
                />
                <input
                  type="number"
                  placeholder="Rate %"
                  value={gst.rate}
                  onChange={(e) =>
                    updateGstOutput(index, "rate", e.target.value)
                  }
                  className={styles.inputSmall}
                />
                {gstOutputs.length > 1 && (
                  <button
                    onClick={() => removeGstOutput(index)}
                    className={styles.removeBtn}
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className={styles.gstAmount}>
                Amount: ₹{gst.amount.toFixed(2)}
              </div>
            </div>
          ))}
          <button onClick={addGstOutput} className={styles.addBtn}>
            + Add GST Output
          </button>
        </div>

        {/* Signature */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Signature/Stamp</h3>
          <textarea
            placeholder="Enter signature text or leave empty"
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            className={styles.textarea}
            rows="3"
          />
        </div>

        {/* Download Button */}
        <button onClick={downloadPDF} className={styles.downloadBtn}>
          📥 Download PDF
        </button>
      </div>

      {/* Invoice Preview */}
      <div className={styles.previewContainer}>
        <div ref={invoiceRef} className={styles.invoice}>
          {/* Header */}
          <div className={styles.invoiceHeader}>
            <h2 className={styles.invoiceTitle}>GST INVOICE</h2>
            <div className={styles.invoiceType}>
              ({invoiceType === "seller" ? "FOR SELLER" : "FOR BUYER"})
            </div>
          </div>

          {/* Seller Info */}
          <div className={styles.infoSection}>
            <div className={styles.infoLabel}>Seller:</div>
            <div className={styles.infoContent}>
              <div className={styles.companyName}>{sellerInfo.name}</div>
              <div>{sellerInfo.address}</div>
              <div>{sellerInfo.location}</div>
              <div>GSTIN/UIN: {sellerInfo.gstin}</div>
              <div>
                State Name: {sellerInfo.location}, Code: {sellerInfo.code}
              </div>
            </div>
          </div>

          {/* Buyer Info */}
          <div className={styles.infoSection}>
            <div className={styles.infoLabel}>Buyer:</div>
            <div className={styles.infoContent}>
              <div className={styles.companyName}>
                {buyerInfo.name || "N/A"}
              </div>
              <div>{buyerInfo.address || "N/A"}</div>
              <div>{buyerInfo.location || "N/A"}</div>
              {buyerInfo.gstin && <div>GSTIN/UIN: {buyerInfo.gstin}</div>}
              {buyerInfo.code && <div>Code: {buyerInfo.code}</div>}
            </div>
          </div>

          {/* Invoice Details */}
          <div className={styles.invoiceDetails}>
            <div className={styles.detailItem}>
              <span>Invoice No:</span>
              <span className={styles.detailValue}>{invoiceNo || "N/A"}</span>
            </div>
            <div className={styles.detailItem}>
              <span>Dated:</span>
              <span className={styles.detailValue}>{invoiceDate}</span>
            </div>
          </div>

          {/* Items Table */}
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Sl No</th>
                <th>Description of Goods</th>
                <th>HSN/SAC</th>
                <th>GST Rate</th>
                <th>Quantity</th>
                <th>Rate</th>
                <th>per</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td>{item.slno}</td>
                  <td>{item.goodsName || "-"}</td>
                  <td>{item.hsnSac || "-"}</td>
                  <td>{item.gstRate}%</td>
                  <td>{item.quantity || "-"}</td>
                  <td>
                    {item.rate ? `₹${parseFloat(item.rate).toFixed(2)}` : "-"}
                  </td>
                  <td>{item.per}</td>
                  <td>₹{item.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Section */}
          <div className={styles.totalsSection}>
            <div className={styles.gstBreakdown}>
              {gstOutputs.map((gst, index) => (
                <div key={index} className={styles.totalRow}>
                  <span>
                    {gst.name} @ {gst.rate}%
                  </span>
                  <span>₹{gst.amount.toFixed(2)}</span>
                </div>
              ))}
              <div className={styles.totalRow}>
                <span>Round Off A/c</span>
                <span>₹{roundOff.toFixed(2)}</span>
              </div>
            </div>

            <div className={styles.subtotalRow}>
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Grand Total */}
          <div className={styles.grandTotal}>
            <span>Total</span>
            <span>Rs. {grandTotal.toFixed(2)}</span>
          </div>

          {/* Amount in Words */}
          <div className={styles.amountWords}>
            <div className={styles.wordsLabel}>
              Amount Chargeable (in words)
            </div>
            <div className={styles.wordsValue}>
              Indian Rupees {numberToWords(grandTotal)} Only
            </div>
          </div>

          {/* Footer with Signature */}
          <div className={styles.footer}>
            <div className={styles.forCompany}>for {sellerInfo.name}</div>
            <div className={styles.signatureArea}>
              {signature && (
                <div className={styles.signatureText}>{signature}</div>
              )}
              <div className={styles.authorizedSignatory}>
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
  );
};

export default InvoiceGenerator;
