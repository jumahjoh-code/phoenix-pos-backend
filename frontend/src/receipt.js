export function printReceipt(cart, total){

let receiptWindow = window.open("", "PRINT", "height=600,width=400")

let itemsHTML = ""

cart.forEach(item => {

itemsHTML += `
<tr>
<td>${item.name}</td>
<td>${item.qty}</td>
<td>${item.retail_price * item.qty}</td>
</tr>
`

})

receiptWindow.document.write(`
<html>
<head>
<title>Phoenix POS Receipt</title>
<style>
body{font-family: monospace}
table{width:100%}
td{padding:4px}
h2{text-align:center}
</style>
</head>

<body>

<h2>Phoenix POS</h2>

<hr>

<table>
<tr>
<th>Item</th>
<th>Qty</th>
<th>Price</th>
</tr>

${itemsHTML}

</table>

<hr>

<h3>Total: ${total}</h3>

<p>Thank you for shopping!</p>

</body>

</html>
`)

receiptWindow.document.close()
receiptWindow.focus()
receiptWindow.print()

}
