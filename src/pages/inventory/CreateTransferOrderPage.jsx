import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiTrash2, FiSearch } from "react-icons/fi";
import { uiToast as toast } from "@/components/ui";
import useBranch from "../../features/branch/hooks/useBranch";
import transferOrderService from "../../features/transfer-order/services/transferOrderService";
import { apiClient } from "@/services";
import workspaceProductService from "../../features/workspace-products/services/workspaceProductService";

import {
  WorkspaceProductSearchBar,
  WorkspaceProductBatchSelectorModal
} from "@/features/workspace-products/components";

const CreateTransferOrderPage = () => {
  const navigate = useNavigate();
  const { branches, getCompanyBranches } = useBranch();

  const [sourceBranchId, setSourceBranchId] = useState("");
  const [destinationBranchId, setDestinationBranchId] = useState("");
  const [remarks, setRemarks] = useState("");
  const [items, setItems] = useState([]);

  const [submitting, setSubmitting] = useState(false);

  // Search & Modal State
  const [searchQuery, setSearchQuery] = useState("");
  const searchBarRef = useRef(null);

  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [selectedProductForBatches, setSelectedProductForBatches] = useState(null);

  useEffect(() => {
    getCompanyBranches();
  }, [getCompanyBranches]);

  const getBranchName = (id) => {
    return branches.find(b => b._id === id)?.name || "Selected Facility";
  };

  const handleSelectWorkspaceProduct = async (prod, details) => {
    const p = details || prod;
    if (!sourceBranchId) {
      toast.error("Please select a source facility first");
      setSearchQuery("");
      searchBarRef.current?.clear?.();
      return;
    }

    // Fetch batches for this product specifically from the source branch
    try {
      const prodId = p._id || p.id;
      const res = await workspaceProductService.getProductFacilityBatchesByQueryV2({
        page: 1,
        limit: 50,
        filters: { facility: sourceBranchId, inStockOnly: true, product: prodId }
      });
      const fetchedBatches = res?.data?.data?.batches || res?.data?.batches || res?.data?.data || [];

      if (fetchedBatches.length === 0) {
        toast.error("No stock available for this product in the source facility.");
        setSearchQuery("");
        searchBarRef.current?.clear?.();
        return;
      }

      // Ensure properties align with what the BatchSelectorModal expects
      const mappedBatches = fetchedBatches.map(b => ({
        ...b,
        productId: prodId,
        productName: p.name || p.displayName,
        stock: b.qty || b.stock,
      }));

      setSelectedProductForBatches({ ...p, facilityBatches: mappedBatches });
      setIsBatchModalOpen(true);
      setSearchQuery("");
      searchBarRef.current?.clear?.();
    } catch (err) {
      console.error(err);
      toast.error("Failed to load batches for the selected product.");
    }
  };

  const handleConfirmAddBatchToCart = (itemsToAdd) => {
    const list = Array.isArray(itemsToAdd) ? itemsToAdd : [itemsToAdd];
    if (list.length === 0) return;

    setItems((prev) => {
      let updatedItems = [...prev];
      list.forEach(item => {
        // Prevent duplicate batches
        if (updatedItems.find(i => i.batch === item.batchId)) {
          toast.error(`Batch ${item.batchNo} is already in the transfer list`);
          return;
        }
        updatedItems.push({
          product: item.productId,
          productName: item.name || item.productName || "Unknown Product",
          batch: item.batchId,
          batchNo: item.batch, // the modal returns the batch number as 'batch'
          availableQty: item.stock, // the modal returns available stock as 'stock'
          transferQty: item.qty || 1
        });
      });
      return updatedItems;
    });
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleQtyChange = (index, val) => {
    const newItems = [...items];
    const qty = parseInt(val) || 0;
    if (newItems[index].availableQty && qty > newItems[index].availableQty) {
      toast.error("Transfer quantity cannot exceed available quantity");
      newItems[index].transferQty = newItems[index].availableQty;
    } else {
      newItems[index].transferQty = qty;
    }
    setItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sourceBranchId) return toast.error("Select source facility");
    if (!destinationBranchId) return toast.error("Select destination facility");
    if (sourceBranchId === destinationBranchId) return toast.error("Source and destination cannot be the same");
    if (items.length === 0) return toast.error("Add at least one item to transfer");

    // validate qtys
    if (items.some(i => i.transferQty <= 0)) {
      return toast.error("Transfer quantity must be greater than 0");
    }

    try {
      setSubmitting(true);
      await transferOrderService.createTransferOrder({
        sourceBranchId,
        destinationBranchId,
        remarks,
        items: items.map(i => ({
          product: i.product,
          batch: i.batch,
          batchNo: i.batchNo,
          transferQty: i.transferQty
        }))
      });
      toast.success("Transfer order created successfully");
      navigate("/inventory/transfer-orders");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create transfer order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <FiArrowLeft className="text-xl text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Create Transfer Order</h1>
          <p className="text-gray-500 text-sm">Transfer stock between facilities</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-6 items-start">
        {/* Left Column - Facilities and Remarks */}
        <div className="w-full md:w-1/3 flex flex-col gap-6 sticky top-6">
          <div className="bg-white p-5 rounded-xl shadow-2xs border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-800 mb-4 border-b pb-2 uppercase tracking-wider">Transfer Details</h2>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Source Facility *</label>
                <select
                  required
                  value={sourceBranchId}
                  onChange={(e) => {
                    setSourceBranchId(e.target.value);
                    setItems([]); // reset items if source changes
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                >
                  <option value="">Select Source</option>
                  {branches.map(b => (
                    <option key={b._id} value={b._id}>{b.name} ({b.type})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Destination Facility *</label>
                <select
                  required
                  value={destinationBranchId}
                  onChange={(e) => setDestinationBranchId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                >
                  <option value="">Select Destination</option>
                  {branches.map(b => (
                    <option key={b._id} value={b._id}>{b.name} ({b.type})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Remarks / Notes</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none h-24"
                  placeholder="Optional notes for this transfer"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 mt-2 text-black bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 font-semibold transition-colors disabled:opacity-50"
              >
                {submitting ? "Creating..." : "Submit"}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Items to Transfer */}
        <div className="w-full md:w-2/3 flex flex-col gap-4">

          <div className="bg-white p-5 rounded-xl shadow-2xs border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-800 mb-4 border-b pb-2 uppercase tracking-wider">Add Products</h2>
            <div className="relative">
              <WorkspaceProductSearchBar
                ref={searchBarRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onSelectProduct={handleSelectWorkspaceProduct}
                branchId={sourceBranchId || null}
                placeholder="Search products by name, SKU, or barcode to add..."
              />
              {!sourceBranchId && (
                <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-[1px] rounded-lg flex items-center justify-center border border-gray-200 cursor-not-allowed">
                  <p className="text-sm font-medium text-gray-500">Select a Source Facility to start searching</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-0 rounded-xl shadow-2xs border border-gray-200 overflow-hidden flex flex-col min-h-[300px]">
            {items.length > 0 ? (
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
                      <th className="p-4 font-semibold">Product</th>
                      <th className="p-4 font-semibold">Batch No</th>
                      <th className="p-4 font-semibold text-right">Available Qty</th>
                      <th className="p-4 font-semibold text-right w-32">Transfer Qty</th>
                      <th className="p-4 font-semibold text-center w-16">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((item, index) => (
                      <tr key={item.batch} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 font-medium text-gray-800 text-sm">{item.productName}</td>
                        <td className="p-4 text-sm text-gray-600 font-mono">{item.batchNo}</td>
                        <td className="p-4 text-sm text-gray-600 text-right">{item.availableQty}</td>
                        <td className="p-4 text-right">
                          <input
                            type="number"
                            min="1"
                            max={item.availableQty}
                            value={item.transferQty}
                            onChange={(e) => handleQtyChange(index, e.target.value)}
                            className="w-full px-2 py-1.5 text-right text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500"
                          />
                        </td>
                        <td className="p-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-500 rounded transition-colors"
                          >
                            <FiTrash2 className="size-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/50">
                <div className="size-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <FiSearch className="size-5 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-800">No items added yet</h3>
                <p className="text-xs text-gray-500 max-w-sm mt-1">Search for products using the bar above to add them to this transfer order.</p>
              </div>
            )}
          </div>

        </div>
      </form>

      {/* Batch Selection Modal (Reused from Sales POS) */}
      <WorkspaceProductBatchSelectorModal
        open={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        product={selectedProductForBatches}
        billingMode={"B2B"}
        branchName={getBranchName(sourceBranchId)}
        onConfirmAddToCart={handleConfirmAddBatchToCart}
      />
    </div>
  );
};

export default CreateTransferOrderPage;
