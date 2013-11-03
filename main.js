#!/usr/bin/env node

var Spooky = require('spooky'),
	applescript = require("applescript"),
	moment = require('moment'),
	argv = require('optimist')
	.usage('Usage: $0 [options]')
    .default({library:'brooklyn', title: 'Brooklyn Public Library'})
    .demand(['u','p'])
    .alias('u','username')
    .alias('p','pin')
    .describe('u', 'library username or barcode')
    .describe('p', 'library pin')
    .describe('library', 'BiblioCommons key')
    .describe('title', 'Reminders list name')
    .argv;

var username= argv.username,
	pin = argv.pin.toString(),
	region = argv.library + ".bibliocommons.com",
	listName = argv.title;

var spooky = new Spooky({
        child: {
            transport: 'http'
        },
        casper: {
            logLevel: 'debug',
            verbose: true
        }
    }, function (err) {
        if (err) {
            e = new Error('Failed to initialize SpookyJS');
            e.details = err;
            throw e;
        }

        spooky.start('https://'+region+'/user/login');
        spooky.then([
		{
        	username:username,
        	pin:pin
        },
        function () {
        	this.fill('form.loginForm', {
        		"name":username,
        		"user_pin":pin
        	}, true)
        }]);
        spooky.then([
	        {
	        	region:region
	        },
        	function() {
	        	this.open('http://'+region+'/checkedout')
        	}
        ])
        spooky.then(function() {
            this.emit('items', this.evaluate(function () {
            	var items = []
            	var books = document.querySelectorAll('.listItem')
            	for (var i=0;i<books.length;i++) {
            		var book = books[i],
            			title = book.querySelector('.title').innerText,
            			due = book.querySelector('.coming_due').innerText
            		items.push({
            			title:title,
            			due:due
            		})
            	}
                return items;
            }));
        })
        spooky.run();
    });

spooky.on('error', function (e, stack) {
    console.error(e);
    if (stack) {
        console.log(stack);
    }
});

spooky.on('items', function (items) {
	add_items_to_remindersapp(items)
});

// spooky.on('log', function (log) {
//     if (log.space === 'remote') {
//         console.log(log.message.replace(/ \- .*/, ''));
//     }
// });

// date must look like "Saturday, November 9, 2013 at 12:00:00 AM", 
function add_items_to_remindersapp(items) {
	items.forEach(function(item) {
		var due_date = moment(item.due.trim()).hours(9), // 9AM seems like a reasonable hour
			remind_me_date = due_date.subtract('days', 2), 
			formatted_title = "'" + item.title + "' is due",
			dateFormat = "dddd, MMMM D, YYYY [at] h:mm:ss A";
		applescript.execFile('reminder.applescript', 
			[
				formatted_title, 
				due_date.format(dateFormat),
				remind_me_date.format(dateFormat),
				listName
			], 
			function(err, rtn) {
			  if (err) return
			  console.log(rtn)			  	
			}
		);
	})
}