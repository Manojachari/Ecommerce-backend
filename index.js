const port=4000;
const express=require("express");
const app=express();
const mongoose=require("mongoose");
const jwt=require("jsonwebtoken");
const multer=require("multer");
const path=require("path");
const cors=require("cors");
const { error } = require("console");
const { type } = require("os");

app.use(express.json());
app.use((cors()));

//Database Connection
mongoose.connect("mongodb+srv://pmanojachari123:123@lift.u2fpa.mongodb.net/?retryWrites=true&w=majority&appName=lift")

//API Creation

app.get("/",(req,res)=>{
    res.send("Express App is Running")
})


//Schema for creating Products

const Product=mongoose.model("Product",{
    id:{
        type:Number,
        required:true,
    },
    name:{
        type:String,
        required:true,
    },
    image:{
        type:String,
        required:true,
    },
    category:{
        type:String,
        required:true,
    },
    new_price:{
            type:Number,
            required:true,
    },
    old_price:{
        type:Number,
        required:true,

    },
    date:{
        type:Date,
        default:Date.now,
    },
    available:{
        type:Boolean,
        default:true,
    },
})

// app.get("/addproduct",(req,res)=>{
//     res.send("Product is Running")
// })

app.post('/addproduct',async(req,res)=>{
    let products=await Product.find({});
    let id;
    if(products.length>0){
        let last_product_array=products.slice(-1);
        let last_product=last_product_array[0];
        id=last_product.id+1;

    }
    else{
        id=1;
    }
    const product=new Product({
        id:id,
        name:req.body.name,
        image:req.body.image,
        category:req.body.category,
        new_price:req.body.new_price,
        old_price:req.body.old_price,
    });
    console.log(product);
    await product.save();
    console.log("Saved");
    res.json({
        success:true,
        name:req.body.name,
    })
})


//Creating API for deleting product

app.post('/removeproduct',async(req,res)=>{
    await Product.findOneAndDelete({id:req.body.id});
    console.log("Removed");
    res.json({
        success:true,
        name:req.body.name,
    })
})


//Creating API for getting all Products

app.get('/allproducts',async(req,res)=>{
    let products=await Product.find({});
    res.send(products)
})


//Schema Creating for User model

const Users=mongoose.model("Users",{
    name:{
        type:String,        
    },
    email:{
        type:String,
        unique:true,
    },
    password:{
        type:String,
    },
    cartData:{
        type:Object,
    },
       
    date:{
            type:Date,
            default:Date.now,
        }
    }
)


//Creating Endpoint for registering the User

app.post('/signup',async(req,res)=>{
    let check= await Users.findOne({email:req.body.email});
    if(check){
        return res.status(400).json({success:false,errors:"Existing user found with Email Id"})
    }
    let cart={};
    for (let i = 0; i < 300; i++) {
        cart[i] =0;
    }
    const user=new Users({
        name:req.body.username,
        email:req.body.email,
        password:req.body.password,
        cartData:cart,
    })

    await user.save();

    const data={
        user:{
            id:user.id
        }
    }
    const token=jwt.sign(data,'secret_ecom');
    res.json({success:true,token})
})


//creating endpint for user login 

app.post('/login',async(req,res)=>{
    let user=await Users.findOne({email:req.body.email});
    if(user){
        const passCompare=req.body.password===user.password;
        if(passCompare){
            const data={
                user:{
                    id:user.id 
                }
            }
            const token=jwt.sign(data,"secret_ecom");
            res.json({success:true,token});
        }
        else{
            res.json({success:false,errors:"Wrong Password"});
        }
    }
    else{
        res.json({success:false,errors:"Wrong Email ID"});
    }
})


//creating endpoint for newcollection data
app.get('/newcollections',async(req,res)=>{
    let products=await Product.find({});
    let newcollection=products.slice(0).slice(-7);
    res.send(newcollection);
    console.log("new collections");
})

//Creating endpoint for populR IN women section

app.get('/popularinwomen',async(req,res)=>{
    let products=await Product.find({category:"women"});
    let popular_in_women=products.slice(0,4);
    console.log("Popular in Women fetched");
    res.send(popular_in_women);
})

//Middleware to Fetch User

const fetchUser=async(req,res,next)=>{
    const token=req.header('auth-token');
    if(!token){
        res.status(401).send({errors:"Please authenticate using valide token"})
    }
    else{
        try {
            const data=jwt.verify(token,'secret_ecom');
            req.user=data.user;
            next();
        } catch (error) {
            res.status(401).send({errors:"Please authenticate using the valid token"})
            
        }
    }
}

//Endpoint for cartdata

app.post('/addtocart',fetchUser,async (req,res)=>{
    console.log("Added",req.body.itemId);
    let userData= await Users.findOne({_id:req.user.id});
    userData.cartData[req.body.itemId]+=1;
    await Users.findOneAndUpdate({_id:req.user.id},{cartData:userData.cartData});
    res.send("Added to Cart")
})


//Creating endpoint to remove product from cartdata

app.post('/removefromcart',fetchUser,async(req,res)=>{
    console.log("Removed",req.body.itemId);
    let userData= await Users.findOne({_id:req.user.id});
    if(userData.cartData[req.body.itemId]>0)
    userData.cartData[req.body.itemId]-=1;
    await Users.findOneAndUpdate({_id:req.user.id},{cartData:userData.cartData});
    res.send("Removed from cart")

})

//creating to get cart data

app.post('/getcart',fetchUser,async(req,res)=>{
    let userData=await Users.findOne({_id:req.user.id});
    res.json(userData.cartData);
})

app.listen(port,(error)=>{
    if(!error){
        console.log("Server Running on Port "+port)
    }
    else{
        console.log("Error : "+error)
    }
})