import React, { useState, useEffect } from "react"

export default function ProductManager(){

const [products,setProducts] = useState([])
const [name,setName] = useState("")
const [barcode,setBarcode] = useState("")
const [price,setPrice] = useState("")

function loadProducts(){

fetch("http://127.0.0.1:8001/products")
.then(res=>res.json())
.then(data=>setProducts(data))

}

useEffect(()=>{
loadProducts()
},[])

function addProduct(){

fetch("http://127.0.0.1:8001/products",{

method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({

name:name,
barcode:barcode,
retail_price:parseFloat(price),
wholesale_price:parseFloat(price),
stock_quantity:100

})

})
.then(()=>{

setName("")
setBarcode("")
setPrice("")
loadProducts()

})

}

return(

<div style={{padding:"30px"}}>

<h2>Add Product</h2>

<input
placeholder="Product Name"
value={name}
onChange={e=>setName(e.target.value)}
/>

<input
placeholder="Barcode"
value={barcode}
onChange={e=>setBarcode(e.target.value)}
/>

<input
placeholder="Price"
value={price}
onChange={e=>setPrice(e.target.value)}
/>

<button onClick={addProduct}>Add Product</button>

<h2>Products</h2>

<table border="1" width="100%">

<thead>
<tr>
<th>ID</th>
<th>Name</th>
<th>Barcode</th>
<th>Price</th>
</tr>
</thead>

<tbody>

{products.map(p=>(
<tr key={p.id}>
<td>{p.id}</td>
<td>{p.name}</td>
<td>{p.barcode}</td>
<td>{p.retail_price}</td>
</tr>
))}

</tbody>

</table>

</div>

)

}
