class CartEngine {

constructor(){

this.items = []

}

add(product){

const existing = this.items.find(i=>i.id===product.id)

if(existing){

existing.qty += 1

}else{

this.items.push({
...product,
qty:1
})

}

}

remove(productId){

this.items = this.items.filter(i=>i.id !== productId)

}

increase(productId){

const item = this.items.find(i=>i.id===productId)

if(item) item.qty += 1

}

decrease(productId){

const item = this.items.find(i=>i.id===productId)

if(item){

item.qty -= 1

if(item.qty <= 0){

this.remove(productId)

}

}

}

clear(){

this.items = []

}

getItems(){

return this.items

}

getTotal(){

return this.items.reduce(
(sum,i)=>sum + i.retail_price*i.qty,
0
)

}

}

export default CartEngine
