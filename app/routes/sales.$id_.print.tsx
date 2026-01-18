import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useState, useEffect } from "react";
import { requireUserToken } from "~/lib/auth.server";
import { api } from "~/lib/api.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const token = await requireUserToken(request);
  const { id } = params;

  if (!id) {
    throw new Response("Sale ID required", { status: 400 });
  }

  const data = await api.getSaleWithLinked(token, id);
  const sale = data.sale;
  const linkedSales = data.linkedSales || [];

  // Format sale date on server to avoid hydration issues
  const date = new Date(sale.quoteDate);
  const saleDate = `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;

  // Combine all items from main sale and linked sales
  const allItems = [...sale.items];
  for (const linked of linkedSales) {
    allItems.push(...linked.items);
  }

  // Calculate combined totals
  const combinedSubtotal = sale.subtotal + linkedSales.reduce((sum: number, s: any) => sum + s.subtotal, 0);
  const combinedDiscount = sale.discount + linkedSales.reduce((sum: number, s: any) => sum + s.discount, 0);
  const combinedShipping = sale.shippingCost + linkedSales.reduce((sum: number, s: any) => sum + s.shippingCost, 0);
  const combinedTotal = sale.total + linkedSales.reduce((sum: number, s: any) => sum + s.total, 0);

  // Get all sale numbers
  const allSaleNumbers = [sale.saleNumber, ...linkedSales.map((s: any) => s.saleNumber)];

  return json({
    sale,
    linkedSales,
    saleDate,
    allItems,
    allSaleNumbers,
    combinedSubtotal,
    combinedDiscount,
    combinedShipping,
    combinedTotal,
    hasLinkedSales: linkedSales.length > 0,
  });
}

export default function PrintReceipt() {
  const {
    sale,
    saleDate,
    allItems,
    allSaleNumbers,
    combinedSubtotal,
    combinedDiscount,
    combinedShipping,
    combinedTotal,
    hasLinkedSales,
  } = useLoaderData<typeof loader>();
  const [currentDate, setCurrentDate] = useState<string>("");

  // Set date only on client to avoid hydration mismatch
  useEffect(() => {
    const now = new Date();
    const d = now.getDate().toString().padStart(2, "0");
    const m = (now.getMonth() + 1).toString().padStart(2, "0");
    const y = now.getFullYear();
    const h = now.getHours().toString().padStart(2, "0");
    const min = now.getMinutes().toString().padStart(2, "0");
    setCurrentDate(`${d}/${m}/${y} ${h}:${min}`);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <style>
        {`
          @media print {
            .no-print {
              display: none !important;
            }
            body {
              margin: 0;
              padding: 0;
            }
            .receipt {
              width: 80mm;
              margin: 0;
              padding: 0;
            }
          }

          @media screen {
            body {
              background: #f3f4f6;
            }
          }
        `}
      </style>

      {/* Print Button - Only visible on screen */}
      <div className="no-print fixed top-4 right-4 flex gap-2">
        <button
          onClick={handlePrint}
          className="bg-black text-white px-6 py-2 font-mono text-sm hover:bg-gray-800"
        >
          PRINT
        </button>
        <button
          onClick={() => window.history.back()}
          className="bg-gray-200 text-black px-6 py-2 font-mono text-sm hover:bg-gray-300"
        >
          BACK
        </button>
      </div>

      {/* Receipt */}
      <div
        className="receipt mx-auto bg-white mt-20"
        style={{ width: "80mm", fontFamily: "monospace" }}
      >
        <div className="p-4 text-xs leading-relaxed">
          {/* Header */}
          <div className="text-center mb-4">
            <div className="text-base font-bold">Toya.pe</div>
            <div>------------------------</div>
            {hasLinkedSales ? (
              <>
                {allSaleNumbers.map((num: string, idx: number) => (
                  <div key={idx}>{num}</div>
                ))}
              </>
            ) : (
              <div>{sale.saleNumber}</div>
            )}
            <div>{saleDate}</div>
            <div>------------------------</div>
          </div>

          {/* Customer */}
          <div className="mb-4">
            <div>Cliente: {sale.customerName}</div>
            <div>{sale.customerDocument}</div>
            <div>--------------------------------</div>
          </div>

          {/* Items - Prices already include IGV */}
          <div className="mb-4">
            {allItems.map((item: any, index: number) => (
              <div key={index} className="mb-2">
                <div className="truncate">{item.productName}</div>
                <div className="flex justify-between">
                  <span>
                    {item.quantity} x ${item.unitPrice.toFixed(2)}
                  </span>
                  <span>${item.subtotal.toFixed(2)}</span>
                </div>
                {item.discount > 0 && (
                  <div className="text-right">-{item.discount}%</div>
                )}
              </div>
            ))}
          </div>

          {/* Separator */}
          <div>================================</div>

          {/* Totals - All prices already include IGV */}
          <div className="mt-2">
            <div className="flex justify-between">
              <span>SUBTOTAL:</span>
              <span>${combinedSubtotal.toFixed(2)}</span>
            </div>
            {combinedDiscount > 0 && (
              <div className="flex justify-between">
                <span>DESC:</span>
                <span>-${combinedDiscount.toFixed(2)}</span>
              </div>
            )}
            {combinedShipping > 0 && (
              <div className="flex justify-between">
                <span>ENVIO:</span>
                <span>${combinedShipping.toFixed(2)}</span>
              </div>
            )}
            <div>--------------------------------</div>
            <div className="flex justify-between font-bold text-sm">
              <span>TOTAL:</span>
              <span>${combinedTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6">
            <div>--------------------------------</div>
            <div className="mt-2">Gracias por su compra!</div>
            {currentDate && (
              <div className="mt-4 text-[10px]">{currentDate}</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
