const express = require('express')
const request = require('request')
var async = require('async')
const app = express()
const bodyParser = require('body-parser')
const { Client } = require('pg');
require('dotenv').config();
const queries = require('./queries').queries;

const port = process.env.PORT || 3000;

function getClient() {
	return new Client({
		connectionString: process.env.DATABASE_URL,
		ssl: {
			rejectUnauthorized: false
		}
	});
}

function runQuery(query, callback){
	const client = getClient();
	client.connect(err => {
		if (err){
			client.end();
			throw err;
		}
		client.query(query, (err, res) => {
			if (err){
				client.end();
				throw err;
			}
			client.end()
			callback(res);
		});
	});
}

function getUsers(callback){
	var users = []
	try{
		runQuery(queries['getUsers'], result => {
			for (let row of result.rows) {
				users.push(row.column_name);
			}
			callback(users);
		})
	}catch(error){
		console.log(error)
		console.log('catch');
	}
}

function getShows(user, callback){
	var shows = []
	try{
		runQuery(queries['getShows'].replace('[USER]', user), result => {
			for (let row of result.rows) {
				shows.push(row[user]);
			}
			callback(shows);
		})
	}catch(error){
		console.log(error)
		console.log('catch');
	}
}

function saveShow(user, show, callback){
	runQuery(queries['saveShow'].replace('[USER]', user).replace('[SHOW]', show), result => {
		callback();
	})
}

function removeShow(user, show, callback){
	runQuery(queries['deleteShow'].replace('[USER]', user).replace('[SHOW]', show), result => {
		callback();
	})
}

function removeUser(user, callback){
	runQuery(queries['deleteUser'].replace('[USER]', user), result => {
		callback();
	})
}

app.set('view engine','ejs')
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: true}))

app.get('/',function(req,res){
	getUsers(function(users){
		res.render('user',{users: users})
	});
})

app.post('/add', function(req,res){
	res.redirect('/home?user='+req.body.name)
})

app.post('/delete', function(req,res){
	var user = req.body.user
	removeUser(user, () => {
			res.redirect('/');
		})
})

app.get('/home', function (req, res) {
	var user = req.query.user
	getShows(user, function(myShows){
		var listeps={}
		async.each(myShows, function(item, callback){
			if(item){
				let url = "https://www.episodate.com/api/show-details?q="+item
				request(url, function (err,response, body){
					if(!err){
						let text = JSON.parse(body)
						var name = text.tvShow.name
						var air={}
						if(text.tvShow.countdown) air=text.tvShow.countdown
							if(air)
								air["id"]=text.tvShow.id;
							air['show_name']=name;
							air['image'] = text.tvShow.image_path
							listeps[name] = air
							callback()
						}
					})
			}else{
				callback()
			}
		},function(err){
			res.render('index',{shows: listeps, error: false, results: null,search:null,page:null, user:user})
		})
	});
})

app.get('/search', function (req, res) {
	var user = req.query.user
	var name = req.query.searchname
	var page = req.query.page
	var listshows={}
	let url = encodeURI("https://www.episodate.com/api/search?q="+name+"&page="+page)
	request(url, function (err,response, body){
		var bodyparse = JSON.parse(body)
		var shows=bodyparse.tv_shows
		for(var show in shows){
			listshows[shows[show].name]=shows[show]
		}
		res.render('search_result',{shows:null,error:false,results:listshows,search:name,page:page,user:user})
	})

})

app.post('/save', function(req,res){
	var user = req.body.user
	var tosave = req.body.selected
	if(tosave){
		saveShow(user, tosave, () => {
			res.redirect('/home?user='+user)
		})
	}else{
		res.redirect('/home?user='+user)
	}
})
app.post('/remove', function(req,res){
	var user = req.body.user
	var torem = req.body.selected
	if(torem){
		removeShow(user, torem, () => {
			res.redirect('/home?user='+user)
		})
	}else{
		res.redirect('/home?user='+user)
	}
})

app.listen(port, function () {
	console.log('app starting on port '+port)
})