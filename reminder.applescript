on run argv
	set bookName to item 1 of argv
	set bookDueDate to item 2 of argv
	set bookDueDateAsDate to date bookDueDate
	set bookRemindDate to item 3 of argv
	set bookRemindDateAsDate to date bookRemindDate
	set bookList to item 4 of argv
	set bookExists to false
	set bookResult to ""
	tell application "Reminders"
		if not (list bookList exists) then
			make list with properties {name:bookList}
		end if
		repeat with i from 1 to (count of every reminder of list bookList)
			set theReminder to reminder i of list bookList
			set reminderName to the name of theReminder
			if reminderName = bookName then
				set bookExists to true
				set due date of reminder i of list bookList to date bookDueDate
				set remind me date of reminder i of list bookList to date bookRemindDate
				set bookResult to "Updated"
			end if
		end repeat
		if bookExists = false then
			tell list bookList
				make new reminder with properties {name:bookName, due date:bookDueDateAsDate, remind me date: bookRemindDateAsDate}
				set bookResult to "Created"
			end tell
		end if
	end tell
	return bookResult&": "&bookName
end run