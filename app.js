const express = require("express");
const https = require("https");
const bodyParser = require("body-parser");
// const date =require(__dirname + "/date.js");   to get date if you are not using mongoose 
const app = express();
const mongoose = require('mongoose');

const _ = require("lodash");

mongoose.Promise = global.Promise;
mongoose.set('useFindAndModify', false);

// Connect MongoDB at default port 27017.
mongoose.connect('mongodb://localhost:27017/todolistDB', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
}, (err) => {
    if (!err) {
        console.log('MongoDB Connection Succeeded.')
    } else {
        console.log('Error in DB connection: ' + err)
    }
});


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const itemSchema = new mongoose.Schema({
    name: String
});

const Item =mongoose.model("Item", itemSchema);

const item1 = new Item({
    name: "welcome tto our todo list!"
});
const item2 = new Item({
    name: "Hit the + button to add new items." 
});
const item3 = new Item({
    name: "<-- hit this to delete this item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemSchema]

}

const List =mongoose.model("List", listSchema);

app.get("/", function(req, res){
    // if you are not using databases you need this otrwise just comment out 
    // let day  = date.getDate();
    //  res.render("list", {listTitle: day , newListItem: items}); // will look into views and find file namesd as list , where replace listTitle with day and newlistItem with items
    Item.find({
    }, (err, items) => {
       if(err){
           console.log(`Error: ` + err)
       } else{
         if(items.length === 0){
            Item.insertMany(
                defaultItems
            ).then((items) => {
                console.log("inserted successfully");
            });
            res.redirect("/");
         } else{
            res.render("list", {listTitle: "Today" , newListItem: items}); // will look into views and find file namesd as list
         }
       }
    });
    
});



app.get('/:customListName', function(req, res){
    const customListItems = _.capitalize(req.params.customListName);

    
    List.findOne({
        name: customListItems,
    }).then((foundList) => {
        if (!foundList) {
            // create new list
            const list = new List({
                name: customListItems,
                items: defaultItems
            });
            list.save();
            res.redirect("/" + customListItems);
        } else{
            // show an existing list
            res.render("list", {listTitle: foundList.name , newListItem: foundList.items});
        }
    });
    
});


// app.get("/work", function(req,res){
//     res.render("list", {listTitle : "Work List" , newListItem: workItems});
// })

app.post("/", function(req,res){
    
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });
    if(listName === "Today"){
        item.save();
        res.redirect("/");
    } else{
        List.findOne({
            name: listName,
        }).then((foundList) => {
            if (!foundList) {
                console.log("no such list")
            } else{
                foundList.items.push(item);
                foundList.save();
                res.redirect("/" + listName);
            }
        });
    }



    // let item = req.body.newItem;
//     if(req.body.list === "Work") {
//         workItems.push(item);
//         res.redirect("/work");
//     }
//     else{
//         items.push(item);
//         res.redirect("/");
//    }

});

app.post("/delete", function(req,res){
    const checkedbox = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === "Today"){
        Item.findByIdAndRemove(checkedbox, function (err,) {
            if (err){
                console.log(err)
            }
            else{
                console.log("Removed checked item");
                res.redirect("/");
            }
        });
    } else{
        List.findOneAndUpdate({
            name: listName,
        }, {
            $pull: {items : {_id: checkedbox}},
        }, (err, doc) => {
            if (err) {
                console.log("error");
            } else {
                res.redirect("/" + listName);
            }
        });
    }
    

});


app.listen(3000, function(){
    console.log("Server is running on port 3000.");
});

