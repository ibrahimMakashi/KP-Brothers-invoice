import React, { useState, useRef } from "react";
import styles from "./App.module.css";
import html2pdf from "html2pdf.js";

function App() {
  const [invoiceType, setInvoiceType] = useState("seller");
  const [isPreview, setIsPreview] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);

  const [seller, setSeller] = useState({
    name: "K P BROTHERS",
    address: "LBS MARKET, HAVERI- 581110, Karnataka",
    gstin: "",
    code: "29",
  });

  const [buyer, setBuyer] = useState({
    name: "",
    address: "",
    gstin: "",
    code: "",
  });

  const [invoiceInfo, setInvoiceInfo] = useState({
    invoiceNo: "",
    date: new Date().toISOString().split("T")[0],
  });

  const [items, setItems] = useState([]);

  const [newItem, setNewItem] = useState({
    goodsName: "",
    gst: "",
    quantity: "",
    rate: "",
    per: "PCS",
    amount: 0,
  });

  const [gstBreakup, setGstBreakup] = useState([
    { name: "CGST @ 2.5%", rate: 2.5, amount: 0 },
    { name: "SGST @ 2.5%", rate: 2.5, amount: 0 },
  ]);

  const invoiceRef = useRef();

  const calculateItemAmount = (qty, rate) => {
    return (parseFloat(qty || 0) * parseFloat(rate || 0)).toFixed(2);
  };

  const handleAddItem = () => {
    if (newItem.goodsName && newItem.quantity && newItem.rate) {
      const amount = calculateItemAmount(newItem.quantity, newItem.rate);
      setItems([...items, { ...newItem, amount: parseFloat(amount) }]);
      setNewItem({
        goodsName: "",
        gst: "",
        quantity: "",
        rate: "",
        per: "PCS",
        amount: 0,
      });
    }
  };

  const confirmDelete = (index) => {
    setDeleteIndex(index);
    setShowDeleteModal(true);
  };

  const handleDelete = () => {
    const updatedItems = items.filter((_, i) => i !== deleteIndex);
    setItems(updatedItems);
    setShowDeleteModal(false);
    setDeleteIndex(null);
  };

  const subtotal = items.reduce(
    (sum, item) => sum + parseFloat(item.amount || 0),
    0
  );

  const calculateGSTAmounts = () => {
    return gstBreakup.map((gst) => ({
      ...gst,
      amount: ((subtotal * gst.rate) / 100).toFixed(2),
    }));
  };

  const gstAmounts = calculateGSTAmounts();
  const totalGST = gstAmounts.reduce(
    (sum, gst) => sum + parseFloat(gst.amount),
    0
  );
  const grandTotal = subtotal + totalGST;
  const roundOff = (Math.round(grandTotal) - grandTotal).toFixed(2);
  const finalTotal = Math.round(grandTotal);

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

    if (num === 0) return "Zero";

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

  const addGSTLine = () => {
    setGstBreakup([...gstBreakup, { name: "", rate: 0, amount: 0 }]);
  };

  const updateGSTLine = (index, field, value) => {
    const updated = [...gstBreakup];
    updated[index][field] = value;
    setGstBreakup(updated);
  };

  const removeGSTLine = (index) => {
    setGstBreakup(gstBreakup.filter((_, i) => i !== index));
  };

  // Fixed PDF Export - Works on all devices
  const exportToPDF = () => {
    const element = invoiceRef.current;

    // Force desktop width for consistent PDF generation
    const opt = {
      margin: [5, 5, 5, 5],
      filename: `invoice_${invoiceInfo.invoiceNo || "draft"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: 794, // A4 width in pixels at 96 DPI (210mm)
        width: 794,
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className={styles.container}>
      {!isPreview && (
        <div className={styles.controls}>
          <h1 className={styles.title}>Invoice Generator</h1>

          {/* Invoice Type Selection */}
          <div className={styles.section}>
            <label className={styles.label}>Invoice For:</label>
            <select
              className={styles.select}
              value={invoiceType}
              onChange={(e) => setInvoiceType(e.target.value)}
            >
              <option value="seller">Seller</option>
              <option value="buyer">Buyer</option>
              <option value="transporter">Transporter</option>
            </select>
          </div>

          {/* Seller Info */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Seller Information</h3>
            <input
              className={styles.input}
              placeholder="Seller Name"
              value={seller.name}
              onChange={(e) => setSeller({ ...seller, name: e.target.value })}
            />
            <textarea
              className={styles.textarea}
              placeholder="Address"
              value={seller.address}
              onChange={(e) =>
                setSeller({ ...seller, address: e.target.value })
              }
              rows="2"
            />
            <div className={styles.row}>
              <input
                className={styles.inputSmall}
                placeholder="GSTIN/UIN"
                value={seller.gstin}
                onChange={(e) =>
                  setSeller({ ...seller, gstin: e.target.value })
                }
              />
              <input
                className={styles.inputSmall}
                placeholder="Code"
                value={seller.code}
                onChange={(e) => setSeller({ ...seller, code: e.target.value })}
              />
            </div>
          </div>

          {/* Buyer Info */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Buyer Information</h3>
            <input
              className={styles.input}
              placeholder="Buyer Name"
              value={buyer.name}
              onChange={(e) => setBuyer({ ...buyer, name: e.target.value })}
            />
            <textarea
              className={styles.textarea}
              placeholder="Address"
              value={buyer.address}
              onChange={(e) => setBuyer({ ...buyer, address: e.target.value })}
              rows="2"
            />
            <div className={styles.row}>
              <input
                className={styles.inputSmall}
                placeholder="GSTIN/UIN"
                value={buyer.gstin}
                onChange={(e) => setBuyer({ ...buyer, gstin: e.target.value })}
              />
              <input
                className={styles.inputSmall}
                placeholder="Code"
                value={buyer.code}
                onChange={(e) => setBuyer({ ...buyer, code: e.target.value })}
              />
            </div>
          </div>

          {/* Invoice Details */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Invoice Details</h3>
            <div className={styles.row}>
              <input
                className={styles.inputSmall}
                placeholder="Invoice No"
                value={invoiceInfo.invoiceNo}
                onChange={(e) =>
                  setInvoiceInfo({ ...invoiceInfo, invoiceNo: e.target.value })
                }
              />
              <input
                className={styles.inputSmall}
                type="date"
                value={invoiceInfo.date}
                onChange={(e) =>
                  setInvoiceInfo({ ...invoiceInfo, date: e.target.value })
                }
              />
            </div>
          </div>

          {/* Add Items */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Items</h3>

            {/* Add Item Button on Top */}
            <button className={styles.addNewItemBtn} onClick={handleAddItem}>
              + Add New Item
            </button>

            <div className={styles.itemsTable}>
              <div className={styles.tableHeader}>
                <div className={styles.thSmall}>Sl</div>
                <div className={styles.thLarge}>Goods Name</div>
                <div className={styles.thSmall}>GST</div>
                <div className={styles.thMedium}>Qty</div>
                <div className={styles.thMedium}>Rate</div>
                <div className={styles.thSmall}>Per</div>
                <div className={styles.thMedium}>Amount</div>
                <div className={styles.thSmall}>Act</div>
              </div>

              {items.map((item, index) => (
                <div key={index} className={styles.tableRow}>
                  <div className={styles.tdSmall}>{index + 1}</div>
                  <div className={styles.tdLarge}>{item.goodsName}</div>
                  <div className={styles.tdSmall}>{item.gst}%</div>
                  <div className={styles.tdMedium}>
                    {item.quantity} {item.per}
                  </div>
                  <div className={styles.tdMedium}>
                    {parseFloat(item.rate).toFixed(2)}
                  </div>
                  <div className={styles.tdSmall}>{item.per}</div>
                  <div className={styles.tdMedium}>
                    ₹{item.amount.toFixed(2)}
                  </div>
                  <div className={styles.tdSmall}>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => confirmDelete(index)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}

              {/* New Item Row */}
              <div className={styles.tableRow}>
                <div className={styles.tdSmall}>{items.length + 1}</div>
                <div className={styles.tdLarge}>
                  <input
                    className={styles.inputCell}
                    placeholder="Goods name"
                    value={newItem.goodsName}
                    onChange={(e) =>
                      setNewItem({ ...newItem, goodsName: e.target.value })
                    }
                  />
                </div>
                <div className={styles.tdSmall}>
                  <input
                    className={styles.inputCell}
                    type="number"
                    placeholder="%"
                    value={newItem.gst}
                    onChange={(e) =>
                      setNewItem({ ...newItem, gst: e.target.value })
                    }
                  />
                </div>
                <div className={styles.tdMedium}>
                  <input
                    className={styles.inputCell}
                    type="number"
                    placeholder="Qty"
                    value={newItem.quantity}
                    onChange={(e) =>
                      setNewItem({ ...newItem, quantity: e.target.value })
                    }
                  />
                </div>
                <div className={styles.tdMedium}>
                  <input
                    className={styles.inputCell}
                    type="number"
                    step="0.01"
                    placeholder="Rate"
                    value={newItem.rate}
                    onChange={(e) =>
                      setNewItem({ ...newItem, rate: e.target.value })
                    }
                  />
                </div>
                <div className={styles.tdSmall}>
                  <select
                    className={styles.selectCell}
                    value={newItem.per}
                    onChange={(e) =>
                      setNewItem({ ...newItem, per: e.target.value })
                    }
                  >
                    <option>PCS</option>
                    <option>PET</option>
                    <option>SET</option>
                    <option>PKT</option>
                    <option>KG</option>
                  </select>
                </div>
                <div className={styles.tdMedium}>
                  ₹{calculateItemAmount(newItem.quantity, newItem.rate)}
                </div>
                <div className={styles.tdSmall}>
                  <button className={styles.addBtn} onClick={handleAddItem}>
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* GST Breakup */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>GST Breakup</h3>
            {gstBreakup.map((gst, index) => (
              <div key={index} className={styles.gstRow}>
                <input
                  className={styles.inputSmall}
                  placeholder="GST Name"
                  value={gst.name}
                  onChange={(e) => updateGSTLine(index, "name", e.target.value)}
                />
                <input
                  className={styles.inputSmall}
                  type="number"
                  step="0.01"
                  placeholder="Rate %"
                  value={gst.rate}
                  onChange={(e) =>
                    updateGSTLine(index, "rate", parseFloat(e.target.value))
                  }
                />
                <button
                  className={styles.removeBtn}
                  onClick={() => removeGSTLine(index)}
                >
                  Remove
                </button>
              </div>
            ))}
            <button className={styles.addGstBtn} onClick={addGSTLine}>
              Add GST Line
            </button>
          </div>

          {/* Action Buttons */}
          <div className={styles.actions}>
            <button
              className={styles.previewBtn}
              onClick={() => setIsPreview(true)}
            >
              Preview Invoice
            </button>
            <button className={styles.downloadBtn} onClick={exportToPDF}>
              Download PDF
            </button>
          </div>
        </div>
      )}

      {/* Invoice Preview - Fixed Desktop Layout for PDF */}
      {isPreview && (
        <div className={styles.previewContainer}>
          <div className={styles.invoiceWrapper}>
            <div ref={invoiceRef} className={styles.invoice}>
              <div className={styles.invoiceHeader}>
                <div className={styles.invoiceTitle}>GST INVOICE</div>
                <div className={styles.invoiceType}>
                  {invoiceType === "seller"
                    ? "(DUPLICATE FOR SELLER)"
                    : invoiceType === "buyer"
                    ? "(DUPLICATE FOR BUYER)"
                    : "(DUPLICATE FOR TRANSPORTER)"}
                </div>
              </div>

              {/* Seller Section */}
              <div className={styles.invoiceSection}>
                <div className={styles.invoiceRow}>
                  <div className={styles.halfWidth}>
                    <div className={styles.bold}>{seller.name}</div>
                    <div className={styles.text}>{seller.address}</div>
                    {seller.gstin && (
                      <div className={styles.text}>
                        GSTIN/UIN: {seller.gstin}
                      </div>
                    )}
                    {seller.code && (
                      <div className={styles.text}>Code: {seller.code}</div>
                    )}
                  </div>
                  <div className={styles.quarterWidth}>
                    <div className={styles.text}>Invoice No.</div>
                    <div className={styles.bold}>{invoiceInfo.invoiceNo}</div>
                  </div>
                  <div className={styles.quarterWidth}>
                    <div className={styles.text}>Dated</div>
                    <div className={styles.bold}>{invoiceInfo.date}</div>
                  </div>
                </div>
              </div>

              {/* Buyer Section */}
              <div className={styles.invoiceSection}>
                <div className={styles.text}>Buyer (Bill to)</div>
                <div className={styles.bold}>{buyer.name}</div>
                <div className={styles.text}>{buyer.address}</div>
                {buyer.gstin && (
                  <div className={styles.text}>GSTIN/UIN: {buyer.gstin}</div>
                )}
                {buyer.code && (
                  <div className={styles.text}>Code: {buyer.code}</div>
                )}
              </div>

              {/* Items Table */}
              <div className={styles.invoiceTable}>
                <div className={styles.invoiceTableHeader}>
                  <div className={styles.colSl}>Sl</div>
                  <div className={styles.colGoods}>Description of Goods</div>
                  <div className={styles.colGst}>GST %</div>
                  <div className={styles.colQty}>Qty</div>
                  <div className={styles.colRate}>Rate</div>
                  <div className={styles.colPer}>Per</div>
                  <div className={styles.colAmount}>Amount</div>
                </div>

                <div className={styles.invoiceTableBody}>
                  {items.map((item, index) => (
                    <div key={index} className={styles.invoiceTableRow}>
                      <div className={styles.colSl}>{index + 1}</div>
                      <div className={styles.colGoods}>{item.goodsName}</div>
                      <div className={styles.colGst}>{item.gst}%</div>
                      <div className={styles.colQty}>
                        {item.quantity} {item.per}
                      </div>
                      <div className={styles.colRate}>
                        {parseFloat(item.rate).toFixed(2)}
                      </div>
                      <div className={styles.colPer}>{item.per}</div>
                      <div className={styles.colAmount}>
                        {item.amount.toFixed(2)}
                      </div>
                    </div>
                  ))}

                  {/* Subtotal */}
                  <div className={styles.invoiceTableRow}>
                    <div className={styles.colSl}></div>
                    <div className={styles.colGoods}></div>
                    <div className={styles.colGst}></div>
                    <div className={styles.colQty}></div>
                    <div className={styles.colRate}></div>
                    <div className={styles.colPer}></div>
                    <div className={styles.colAmount}>
                      {subtotal.toFixed(2)}
                    </div>
                  </div>

                  {/* GST Rows */}
                  {gstAmounts.map((gst, index) => (
                    <div key={index} className={styles.invoiceTableRow}>
                      <div className={styles.colSl}></div>
                      <div className={styles.colGoods}>{gst.name}</div>
                      <div className={styles.colGst}></div>
                      <div className={styles.colQty}></div>
                      <div className={styles.colRate}>{gst.rate}%</div>
                      <div className={styles.colPer}></div>
                      <div className={styles.colAmount}>{gst.amount}</div>
                    </div>
                  ))}

                  {/* Round Off */}
                  <div className={styles.invoiceTableRow}>
                    <div className={styles.colSl}></div>
                    <div className={styles.colGoods}>Round Off A/c</div>
                    <div className={styles.colGst}></div>
                    <div className={styles.colQty}></div>
                    <div className={styles.colRate}></div>
                    <div className={styles.colPer}></div>
                    <div className={styles.colAmount}>{roundOff}</div>
                  </div>

                  {/* Total Row - Inside Body */}
                  <div className={styles.invoiceTableFooter}>
                    <div className={styles.colSl}></div>
                    <div className={styles.colGoods}>Total</div>
                    <div className={styles.colGst}></div>
                    <div className={styles.colQty}></div>
                    <div className={styles.colRate}></div>
                    <div className={styles.colPer}></div>
                    <div className={styles.colAmount}>
                      Rs. {finalTotal.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Amount in Words */}
              <div className={styles.amountWords}>
                <div className={styles.text}>Amount Chargeable (in words)</div>
                <div className={styles.bold}>
                  Indian Rupees {numberToWords(finalTotal)} Only
                </div>
              </div>

              {/* Signature Section */}
              <div className={styles.signatureSection}>
                <div className={styles.signatureBox}>
                  <div className={styles.text}>for {seller.name}</div>
                  <div className={styles.signatureSpace}></div>
                  <div className={styles.text}>Authorised Signatory</div>
                </div>
              </div>

              <div className={styles.footer}>
                This is a Computer Generated Invoice
              </div>
            </div>
          </div>

          {/* Back Button for Preview */}
          <div className={styles.previewActions}>
            <button
              className={styles.backBtn}
              onClick={() => setIsPreview(false)}
            >
              Back to Edit
            </button>
            <button className={styles.downloadBtn} onClick={exportToPDF}>
              Download PDF
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Confirm Delete</h3>
            <p className={styles.modalText}>
              Are you sure you want to delete this item?
            </p>
            <div className={styles.modalActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button className={styles.confirmBtn} onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
