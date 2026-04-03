export function printReceipt(cart,total){

let win = window.open("","","width=400,height=600")

let rows=""

cart.forEach(i=>{
rows+=`
<tr>
<td>${i.name}</td>
<td>${i.qty}</td>
<td>${i.retail_price*i.qty}</td>
</tr>
`
})

win.document.write(`

<h2>Phoenix POS</h2>
<hr>

<table>
<tr>
<th>Item</th>
<th>Qty</th>
<th>Price</th>
</tr>

${rows}

</table>

<hr>

<h3>Total: ${total}</h3>

`)

win.print()

}
