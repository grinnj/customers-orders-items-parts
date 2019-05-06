const express = require("express");

const app = express();

const sqlite3 = require("sqlite3").verbose();

const fs=require("fs");

app.set('view engine', 'ejs');

app.use(express.static(__dirname + '/views'));

const port = 80;

var Ddos = require('ddos');
var ddos = new Ddos({burst:10, limit:15});
app.use(ddos.express);

var db = new sqlite3.Database('./customers-orders-items-parts.db', (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Connected to the database.');
    }
});

//Создание таблиц
/*db.serialize(function() {
  db.run("CREATE TABLE IF NOT EXISTS customers (id INTEGER PRIMARY KEY,first_name TEXT, second_name TEXT, phone TEXT, email TEXT)",(err)=>{
	if (err) {
        console.error(err.message);
    } else {
        console.log('Customers table created.');
		db.run("CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY, name TEXT)",(err)=>{
			if (err) {
				console.error(err.message);
			} else {
				console.log('Items table created.');
				db.run("CREATE TABLE IF NOT EXISTS parts (id INTEGER PRIMARY KEY, item_id INTEGER, name TEXT, price TEXT, FOREIGN KEY (item_id) REFERENCES items(id))",(err)=>{
					if (err) {
						console.error(err.message);
					} else {
						console.log('Parts table created.');
						db.run("CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY, customer_id INTEGER, item_id INTEGER, date TEXT, FOREIGN KEY (customer_id) REFERENCES customers(id), FOREIGN KEY (item_id) REFERENCES items(id))",(err)=>{
							if (err) {
								console.error(err.message);
							} else {
								console.log('Orders table created.');
							} 
						});
					} 
				});
			} 
		});
    } 
  });
});*/

/*insertItem("Желтый банан");
insertPart("Желтый банан","Банан",101);
insertPart("Желтый банан","Желтый чехол для банана",250);
insertItem("Компьютер");
insertPart("Компьютер","Процессор",2550);
insertPart("Компьютер","Видеокарта",1500);
insertPart("Компьютер","Память",800);
insertCustomer("Дмитрий","Дмитриев","380-666-69-69","dmitruy@email.com");
insertOrder(3,"Компьютер","05-02-2019");
insertCustomer("Владик","Горький","1337-69-88-41","vadim@email.com");
insertOrder(4,"Желтый банан","21-06-2019");
insertPart("Желтый банан","Желтый чехол для банана",250);*/
//deleteRowFrom("parts","7");

app.get("/", function(request, response){
	getOrdersList(function (dbvar){
		console.log("Request /");
		response.render('index.ejs',{dbvar:dbvar});
	});
});

app.get("/orders", function(request, response){
	//console.log("Request </>");
	response.redirect('/');
});

app.get("/parts", function(request, response){
	getPartsList(function (dbvar){
		getItemsById(dbvar,function(dbvar){
			console.log("Request </parts>");
			response.render('parts.ejs',{dbvar:dbvar});
		});
	});
});

app.get("/items", function(request, response){
	getItemsList(function (dbvar){
		console.log("Request </items>");
		response.render('items.ejs',{dbvar:dbvar});
	});
});

app.get("/customers", function(request, response){
	getCustomersList(function (dbvar){
		console.log("Request </items>");
		response.render('customers.ejs',{dbvar:dbvar});
	});
});

function insertCustomer(firstName, secondName, phone, email){
	if((typeof(firstName)==='undefined')||(typeof(secondName)==='undefined')){
		return console.log("First or Second name is undefined. Cannot insert a row to customers table.");
	}
	if(typeof(phone)==='undefined'){let phone = 'Не указан';}
	if(typeof(email)==='undefined'){let email = 'Не указан';}
	db.run(`INSERT INTO customers(first_name, second_name, phone, email) VALUES(?,?,?,?)`, [firstName,secondName,phone,email], function(err) {
		if (err) {
			return console.log(err.message);
		}
		// get the last insert id
		console.log(`A row has been inserted to customers table with rowid ${this.lastID}`);
	});
}

function insertOrder(customer_id, item_name, date){
	db.get(`SELECT id FROM items WHERE name  = ?`, [item_name], (err, row) => {
		if (err) {
			return console.error(err.message);
		}
		if(row){
			db.run(`INSERT INTO orders(customer_id, item_id, date) VALUES(?,?,?)`, [customer_id, row.id, date], function(err) {
				if (err) {
					return console.log(err.message);
				}
				// get the last insert id
				console.log(`A row has been inserted to orders table with rowid ${this.lastID}`);
			});
		}else{
			return console.log("Customer with current id does not exist");
		}
	});
}

function insertItem(item_name){
	if(typeof(item_name)==='undefined'){
		return console.log("Item name is undefined. Cannot insert a row to items table.");
	}
	db.run(`INSERT INTO items(name) VALUES(?)`, [item_name], function(err) {
		if (err) {
			return console.log(err.message);
		}
		// get the last insert id
		console.log(`A row has been inserted to items table with rowid ${this.lastID}`);
	});
}

function insertPart(item_name, name, price){
	if((typeof(item_name)==='undefined')||(typeof(name)==='undefined')){
		return console.log("Item name or Part name is undefined. Cannot insert a row to parts table.");
	}
	if(typeof(price)==='undefined'){let price = 'Не указана';}
	db.get(`SELECT id FROM items WHERE name  = ?`, [item_name], (err, row) => {
		if (err) {
			return console.error(err.message);
		}
		if(row){
		db.run(`INSERT INTO parts(item_id, name, price) VALUES(?,?,?)`, [row.id, name, price], function(err) {
			if (err) {
				return console.log(err.message);
			}
			// get the last insert id
			console.log(`A row has been inserted to items table with rowid ${this.lastID}`);
		});}
	});
}

function deleteRowFrom(table_name, row_id){
	db.run(`DELETE FROM ${table_name} WHERE id = ${row_id}`,[]);
}

/*	getOrdersList();
	returning data format:
	dbvar=[];
	dbvar[0]={};
	dbvar[0].order_id="10101";
	dbvar[0].item_name="Chtoto";
	dbvar[0].customer="Artem Petuh";
	dbvar[0].date="22-08-1488"*/
function getOrdersList(callback){
	let dbvar1=[];
	db.all(`SELECT orders.id, orders.date, items.name, customers.first_name, customers.second_name FROM orders INNER JOIN items on items.id = orders.item_id INNER JOIN customers on customers.id = orders.customer_id`,[], (err, row) => {
		if (err) {
			return console.error(err.message);
		}
		if(row){
			//console.log(row);
			for(let i=0; i<row.length;i++){
				dbvar1[i]={};
				dbvar1[i].order_id=row[i].id;
				dbvar1[i].item_name=row[i].name;
				dbvar1[i].customer=row[i].first_name+' '+row[i].second_name;
				dbvar1[i].date=row[i].date;
			}
			callback(dbvar1);
		}
	});
}

function getCustomersList(callback){
	let dbvar1=[];
	db.all(`SELECT id, first_name, second_name, phone, email FROM customers`,[], (err, row) => {
		if (err) {
			return console.error(err.message);
		}
		if(row){
			//console.log(row);
			for(let i=0; i<row.length;i++){
				dbvar1[i]={};
				dbvar1[i].customer_id=row[i].id;
				dbvar1[i].first_name=row[i].first_name;
				dbvar1[i].second_name=row[i].second_name;
				dbvar1[i].phone=row[i].phone;
				dbvar1[i].email=row[i].email;
			}
			callback(dbvar1);
		}
	});
}

function getItemsList(callback){
	let dbvar1=[];
	db.all(`SELECT id, name FROM items`,[], (err, row) => {
		if (err) {
			return console.error(err.message);
		}
		if(row){
			//console.log(row);
			for(let i=0; i<row.length;i++){
				dbvar1[i]={};
				dbvar1[i].item_id=row[i].id;
				dbvar1[i].name=row[i].name;
			}
			callback(dbvar1);
		}
	});
}

function getPartsList(callback){
	let dbvar1=[];
	db.serialize(function() {
	db.all(`SELECT item_id, id, name, price FROM parts`,[], (err, row) => {
		if (err) {
			return console.error(err.message);
		}
		if(row){
			//console.log(row);
			for(let i=0; i<row.length;i++){
				//console.log(row[i]);
				dbvar1[i]={};
				dbvar1[i].part_id=row[i].id;
				dbvar1[i].name=row[i].name;
				dbvar1[i].price=row[i].price;
				dbvar1[i].item_id=row[i].item_id;
			};
			callback(dbvar1);
		}
	});
	});
}

function getItemsById(dbvar2,callback){
	db.all(`SELECT id,name FROM items`, [], (err, row) => {
		if (err) {
			return console.error(err.message);
		}
		if(row){
			for(let i=0;i<row.length;i++){
				for(let j=0;j<dbvar2.length;j++){
					if(dbvar2[j].item_id==row[i].id){
						dbvar2[j].item_name=row[i].name;
					}
				}
			}
			callback(dbvar2);
		}
	});
}

app.listen(port);