import { Order, Language, Currency } from '../types';

interface InvoicePrintProps {
  order: Order;
  lang: Language;
  currency: Currency;
  usdRate: number;
}

export default function InvoicePrint(props: InvoicePrintProps) {
  const isAr = props.lang === 'ar';
  
  // Format prices helper
  const formatPrice = (sarAmount: number) => {
    if (props.currency === 'USD') {
      return `$ ${(sarAmount * props.usdRate).toFixed(2)}`;
    }
    return `${sarAmount.toFixed(2)} ${isAr ? 'ريال' : 'SAR'}`;
  };

  return (
    <div id={`invoice-print-${props.order.id}`} className="p-8 bg-white text-gray-800 border rounded-lg shadow-sm font-sans max-w-2xl mx-auto print:border-none print:shadow-none print:p-0">
      {/* Header */}
      <div className="flex justify-between items-start border-b pb-6 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-amber-700 tracking-tight">ZafNira Spices</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isAr ? 'بيت البهارات العربية الفاخرة' : 'Premium Arabian Spice House'}
          </p>
          <div className="text-xs text-gray-400 mt-2 space-y-0.5">
            <p>{isAr ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Kingdom of Saudi Arabia'}</p>
            <p>{isAr ? 'الرقم الضريبي الكود: ٣٠١٤٥٨٢٦٩' : 'KSA VAT ID: 301458269'}</p>
            <p>Email: info@zafnira.com | Tel: +966 50 123 4567</p>
          </div>
        </div>
        <div className="text-right">
          <div className="inline-block bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-3">
            {isAr ? 'فاتورة ضريبية مبسطة' : 'Simplified Tax Invoice'}
          </div>
          <p className="font-semibold text-gray-500 text-sm">{isAr ? 'رقم الطلب:' : 'Order ID:'}</p>
          <p className="font-mono text-gray-900 font-bold">{props.order.id.substring(0, 10).toUpperCase()}</p>
          <p className="text-xs text-gray-500 mt-1">
            {isAr ? 'التاريخ:' : 'Date:'} {new Date(props.order.createdAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
          </p>
        </div>
      </div>

      {/* Customer info */}
      <div className="grid grid-cols-2 gap-6 mb-8 bg-gray-50 p-4 rounded-md border text-sm">
        <div>
          <p className="font-semibold text-amber-900 mb-2">{isAr ? 'معلومات العميل:' : 'Customer Details:'}</p>
          <p className="font-bold text-gray-900">{props.order.customerInfo.name}</p>
          <p className="text-gray-600">{props.order.customerInfo.email}</p>
          <p className="text-gray-600">{props.order.customerInfo.phone}</p>
        </div>
        <div>
          <p className="font-semibold text-amber-900 mb-2">{isAr ? 'عنوان الشحن والتوصيل:' : 'Shipping Address:'}</p>
          <p className="text-gray-800 leading-relaxed font-medium">
            {props.order.shippingAddress.street}, <br />
            {props.order.shippingAddress.city}, <br />
            {props.order.shippingAddress.zipCode}, {props.order.shippingAddress.country}
          </p>
        </div>
      </div>

      {/* Grid of Items */}
      <table className="w-full text-left border-collapse mb-8 text-sm">
        <thead>
          <tr className="bg-amber-800 text-white rounded-t-md">
            <th className="p-3 font-semibold rounded-l-md">{isAr ? 'المنتج والوزن' : 'Spice Product & Packing'}</th>
            <th className="p-3 text-center font-semibold">{isAr ? 'الكمية' : 'Qty'}</th>
            <th className="p-3 text-right font-semibold">{isAr ? 'سعر الوحدة' : 'Unit Price'}</th>
            <th className="p-3 text-right font-semibold rounded-r-md">{isAr ? 'الإجمالي' : 'Total'}</th>
          </tr>
        </thead>
        <tbody className="divide-y text-gray-700">
          {props.order.items.map((item, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="p-3">
                <p className="font-bold text-gray-900">
                  {isAr ? item.productNameAr : item.productNameEn}
                </p>
                <div className="inline-block px-2 py-0.5 mt-1 text-xs bg-amber-50 text-amber-800 border rounded">
                  {item.weight}
                </div>
              </td>
              <td className="p-3 text-center font-bold">{item.quantity}</td>
              <td className="p-3 text-right">{formatPrice(item.priceSAR)}</td>
              <td className="p-3 text-right font-bold text-gray-950">
                {formatPrice(item.priceSAR * item.quantity)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Calculations */}
      <div className="w-full flex justify-end">
        <div className="w-80 space-y-2 text-sm border-t pt-4">
          <div className="flex justify-between text-gray-600">
            <span>{isAr ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
            <span className="font-medium">{formatPrice(props.order.subtotalSAR)}</span>
          </div>
          {props.order.discountSAR > 0 && (
            <div className="flex justify-between text-red-600 font-medium">
              <span>{isAr ? 'الخصم الكوبون:' : 'Coupon Discount:'}</span>
              <span>-{formatPrice(props.order.discountSAR)}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-600">
            <span>{isAr ? 'رسوم الشحن:' : 'Delivery Charge:'}</span>
            <span className="font-medium">{formatPrice(props.order.deliveryChargeSAR)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>{isAr ? 'ضريبة القيمة المضافة (١٥٪):' : 'VAT (15%):'}</span>
            <span className="font-medium">{formatPrice(props.order.taxSAR)}</span>
          </div>
          <div className="flex justify-between text-base font-extrabold text-gray-900 border-t pt-3">
            <span>{isAr ? 'الإجمالي النهائي:' : 'Grand Total:'}</span>
            <span className="text-amber-800">{formatPrice(props.order.totalSAR)}</span>
          </div>
        </div>
      </div>

      {/* Footer message */}
      <div className="mt-12 border-t pt-6 text-center text-xs text-gray-400 space-y-1">
        <p className="font-semibold text-gray-500">
          {isAr ? 'شكراً لتسوقكم من بهارات زعفنيرا!' : 'Thank you for shopping at ZafNira Spices!'}
        </p>
        <p>{isAr ? 'ملاحظة: هذه فاتورة ضريبية إلكترونية مبسطة صادرة بالنيابة عن المورد.' : 'Note: This is an electronic simplified VAT receipt generated online.'}</p>
        <button
          id="invoice-print-trigger"
          onClick={() => window.print()}
          className="mt-4 px-4 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded shadow transition-all duration-200 cursor-pointer print:hidden inline-block"
        >
          {isAr ? 'طابعة الفاتورة' : 'Print Invoice'}
        </button>
      </div>
    </div>
  );
}
