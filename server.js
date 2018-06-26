const express = require('express')
const request = require('request')
var fs = require('fs')
var async = require('async')
const app = express()
const bodyParser = require('body-parser')

app.set('view engine','ejs')
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: true}))

app.get('/',function(req,res){
	fs.readdir('public/users/', function(err,items){
		res.render('user',{users:items})
	})
})

app.post('/add', function(req,res){
	res.redirect('/home?user='+req.body.name)
})

app.get('/home', function (req, res) {
	var user = req.query.user
	fs.appendFile('public/users/'+user+".txt", '',function(err){
		if(!err){

			fs.readFile('public/users/'+user+".txt",function(err,data){
				if(!err){
					var myShows=[]
					if(data != '')
						myShows = JSON.parse(data)
					var listeps={}
					async.each(myShows, function(item,callback){
						let url = "https://www.episodate.com/api/show-details?q="+item
						request(url, function (err,response, body){
							if(!err){
								let text = JSON.parse(body)
								var name = text.tvShow.name
								var air={}
								if(text.tvShow.countdown!==null) air=text.tvShow.countdown
								if(air!==null)air["id"]=text.tvShow.id;
								listeps[name] = air
								callback()
							}
						})
					},function(err){
						res.render('index',{shows: listeps, error: false, results: null,search:null,page:null, user:user})
					})
				}
			})
		}
	})
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
			listshows[shows[show].name]=shows[show].id
		}
		res.render('index',{shows:null,error:false,results:listshows,search:name,page:page,user:user})
	})

})

app.post('/save', function(req,res){
	var user = req.body.user
	var tosave = req.body.selected
	if(tosave){
		fs.readFile('public/users/'+user+".txt",function(err,data){
			if(!err){
				var list =[]
				if(data!='')
					list = JSON.parse(data)
				list = list.concat(tosave)
				fs.writeFile('public/users/'+user+".txt",JSON.stringify(list),function(err){
					if(!err){
						res.redirect('/home?user='+user)
					}
				})
			}
		})
	}else{
		res.redirect('/home?user='+user)
	}
})
app.post('/remove', function(req,res){
	var user = req.body.user
	var torem = req.body.selected
	if(torem){
		fs.readFile('public/users/'+user+".txt",function(err,data){
			if(!err){
				var list =[]
				if(data!='')
					list = JSON.parse(data)
				list = list.filter( ( el ) => !torem.includes( el ) );
				fs.writeFile('public/users/'+user+".txt",JSON.stringify(list),function(err){
					if(!err){
						res.redirect('/home?user='+user)
					}
				})
			}
		})
	}else{
		res.redirect('/home?user='+user)
	}
})

app.listen(3000, function () {
	console.log('listening on port 3000!')
})