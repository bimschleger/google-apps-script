/* 
*
* A straightforward workflow to automate employee time off requests.
*
* Get the time off request.
* Add it to the company calendar.
* Email the requester and approver(s) with a link to the calendar event.
* 
*/


/*
* 
* Creates the initial form.
* 
*/

function createForm() {
  
  // Creates the form
  var form = FormApp.create("Arthur flex time requests");
  
  // Makes collecting user's email mandatory
  form.setCollectEmail(true);
  
  // Adds fields to the form
  form.addDateItem()
    .setTitle('When is the first day that you will not be in the office?');
  form.addDateItem()
    .setTitle('When is the first day that you will be back in the office?');
  
  // Get the URL to the form
  var publicURL = form.getPublishedUrl();
  
  // Get the ID to the form, used in later steps
  var form_id = form.getId();
}


/*
* 
* Creates the trigger that fires whenever a new form is submitted.
* 
*/

function createTriggerOnFormSubmit() {
  
  // Get the form
  var url = "https://docs.google.com/forms/d/1Pb_y0X7ZB0Os3K8d0byMPGaHZbWQgc1YsTt6PlJQKhI/edit";
  var form = FormApp.openByUrl(url);
  
  // Create the trigger
  ScriptApp.newTrigger("getFormResponseData")
    .forForm(form)
    .onFormSubmit()
    .create();
}


/*
* 
* Views the initial output for the form.
* 
*/

function getFormResponseData() {
  
  // Get all form resonses.
  var form = FormApp.openById("1Pb_y0X7ZB0Os3K8d0byMPGaHZbWQgc1YsTt6PlJQKhI");
  var formResponses = form.getResponses();

  // Gets the most recent form submission.
  var recent_response = formResponses[formResponses.length - 1];
  var email = recent_response.getRespondentEmail();
  var name = getFirstName(email);
  
  // Gets an array of all the answers for a form submission
  var item_responses = recent_response.getItemResponses();
  
  // Get flex dates as string.
  var start_date_text = item_responses[0].getResponse();
  var end_date_text = item_responses[1].getResponse();
  
  // Convert start/end dates form strings into date objects.
  var start_date = new Date(start_date_text + " 00:00:00 GMT-0700");
  var end_date = new Date(end_date_text + " 00:00:00 GMT-0700");
  
  // Get URL for new flex calendar event.
  var url = createCalendarEvent(start_date, end_date, name);
  
  sendEmailTorequester(email, name, start_date,end_date, url);
}


/*
*
* Gets all calendars that my account owns.
*
*/

function getMyCalendars() {
  
  var myCalendars = CalendarApp.getAllOwnedCalendars();
  
  // Cycles through my calendars and gets name and ID
  myCalendars.forEach(function(cal) {
    
    var calName = cal.getName();
    var calId = cal.getId();
    Logger.log(calName + ": " + calId);
    
  });
}


/*
*
* Get the first name of the person who submitted the form.
* 
* @param {string} email - The email of the person who submitted the form.
* @return {string} name - The name of the person requesting flex time. 
*
*/

function getFirstName(email) {
  
  // Object with email:name key:value pairs.
  var employees = {
    "bim@arthur.design": "Bim",
    "david@arthur":"David",
    "nate@arthur.design": "Nate",
    "andrea@arthur.design": "Andrea",
    "nik@arthur.design": "Nik",
    "teddy@arthur.design": "Teddy"
  }
  
  var name = employees[email];
  return name;
}


/*
* 
* @param {Date} start_date - The first date of the Flex time request.
* @param {Date} end_date - The last date of the Flex time request.
* @param {string} name - The name of the person requesting flex time.
* 
*/

function createCalendarEvent(start_date, end_date, name) {
  
  // Get Arthur Internal calendar
  var calendarId = "arthur.design_8mnrvpkmi1egj95dh1ucrvv5po@group.calendar.google.com"
  var cal = CalendarApp.getCalendarById(calendarId);
  
  // Create title of calendar event
  var title = "Pending: " + name + " out";
  
  // Create event in Arthur Internal
  var event = cal.createAllDayEvent(title, start_date, end_date);
  
  // Construct URL for event that the system created
  var eventId = event.getId();
  var url = createEventUrl(calendarId, eventId);
  
  return url;
}


/*
* 
* Get the encoded url for the "Flex" calendar event.
*
* @param {string} calendarId - calendar Id for the Arthur Internal calendar.
* @param {string} eventId - eventID for the newly-created calendar event.
* @return {string} url - The encoded edit URL for the newly-created calendar event.
* 
*/

function createEventUrl(calendarId, eventId) {
  
  // Creating components of the Google Calendar URL
  var calId = calendarId.split("@group.calendar.google.com")[0] + "@g";
  var eventId_true = eventId.split("@google.com")[0];
  var editCalBaseUrl = "https://calendar.google.com/calendar/r/eventedit/";
  
  // Prepping and encoding the unique calendar event URL
  var calString = eventId_true + " " + calId;
  var encoded = Utilities.base64Encode(calString);
  var url = editCalBaseUrl + encoded;
  
  return url;
}


/*
* 
* Send a confirmation email of the request to the requester.
* 
* @param {string} email - The email address of the person requesting flex time.
* @param {string} name - The name of the person requesting flex time.
* @param {Date} start_date - The first date of the Flex time request.
* @param {Date} end_date - The last date of the Flex time request.
* 
*/

function sendEmailTorequester(emailAddress, name, start_date, end_date, url) {
  
  // On the form, I ask for the date that the requester returns to the office.
  // Need to decrement that date by 1 to determine the true time out of office.
  end_date.setDate(end_date.getDate() - 1);
  
  // Convert dates to strings
  var start_date_text = getDateString(start_date);
  var end_date_text = getDateString(end_date);
  
  // Generate email title
  var title = "Request: " + name + "out (" + start_date_text + "-" + end_date_text +")";
  
  // Generate HTML body for the email
  var body = name +",<br><br>We received your request for flex time from "+ start_date_text + "-" + end_date_text + 
    ".<br><br><a href = '" + url +"'>View your flex request.</a>";
  
  // Include options into the email
  var options = {
    cc: "bim@arthur.design, david@arthur.design",
    htmlBody: body
  };
  
  // Send the HTML body email via the GmailApp
  GmailApp.sendEmail(emailAddress, title, "", options);
};


/*
* 
* Returns a date in MM/DD/YYYY string format
* 
* @param {Date} date - A date object to convert into a MM/DD/YYYY string.
* @return {string} date_string - A MM/DD/YYYY date string.
* 
*/

function getDateString(date) {
  
  var date_string = date.getMonth()+1 + "/" + date.getDate() + "/" + date.getFullYear();
  return date_string;
  
};