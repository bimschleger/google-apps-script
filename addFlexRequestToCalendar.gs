/* 

- calendar stuff
- get arhtur internal calendar id
- create an event on arthur internal
- get the event id for the arthur internal event
- generate a direct url to that event

https://developers.google.com/calendar/v3/reference/events/get#examples

https://stackoverflow.com/questions/53928044/how-do-i-construct-a-link-to-a-google-calendar-event/53928045#53928045

*/



/*
* 
* Creates the initial form.
* 
*/

function createForm() {
  
  var form = FormApp.create("Arthur flex time requests");
  
  form.setCollectEmail(true);
  
  form.addDateItem()
    .setTitle('When is the first day that you will not be in the office?');
  form.addDateItem()
    .setTitle('When is the first day that you will be back in the office?');
  
  var publicURL = form.getPublishedUrl();
  
  Logger.log("Published URL: " + publicURL);
  
  var form_id = form.getId();
  Logger.log(form_id);
  
}


/*
* 
* Creates the trigger that fires whenever a new form is submitted.
* 
*/

function createTriggerOnFormSubmit() {
  
  var url = "https://docs.google.com/forms/d/1Pb_y0X7ZB0Os3K8d0byMPGaHZbWQgc1YsTt6PlJQKhI/edit";
  var form = FormApp.openByUrl(url);
  
  ScriptApp.newTrigger("getFormResponseData")
    .forForm(form)
    .onFormSubmit()
    .create();
}


/*
* 
* views the initial output for the form.
* 
*/

function getFormResponseData() {
  
  var form = FormApp.openById("1Pb_y0X7ZB0Os3K8d0byMPGaHZbWQgc1YsTt6PlJQKhI");
  var formResponses = form.getResponses();

  // Gets the msot recent form submission.
  var recent_response = formResponses[formResponses.length - 1];
  var email = recent_response.getRespondentEmail();
  
  // Gets an array of all the answers for a form submission
  var item_responses = recent_response.getItemResponses();
  
  var start_date_text = item_responses[0].getResponse();
  var end_date_text = item_responses[1].getResponse();
  
  // Convert start/end dates form strings into date objects.
  var start_date = new Date(start_date_text + " 00:00:00 GMT-0700");
  var end_date = new Date(end_date_text + " 00:00:00 GMT-0700");
  
  var name = getFirstName(email);
  
  var url = createCalendarEvent(start_date, end_date, name);
  
  sendEmailToRequestor(email, name, start_date,end_date, url);
  
  

}


/*
*
* Gets all calendars that my account owns.
*
*/

function getMyCalendars() {
  
  var myCalendars = CalendarApp.getAllOwnedCalendars();
  
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
  
  var calendarId = "arthur.design_8mnrvpkmi1egj95dh1ucrvv5po@group.calendar.google.com"
  var cal = CalendarApp.getCalendarById(calendarId);
  var title = "Pending: " + name + " out"
  var event = cal.createAllDayEvent(title, start_date, end_date);
  
  var eventId = event.getId();
  
  var url = createEventUrl(calendarId, eventId)
  
  return url;
  
}


/*
* 
* @param {string} calendarId - calendar Id for the Arthur Internal calendar.
* @param {string} eventId - eventID for the newly-created calendar event.
* @return {string} url - The encoded edit URL for the newly-created calendar event.
* 
*/

function createEventUrl(calendarId, eventId) {
  
  var calId = calendarId.split("@group.calendar.google.com")[0] + "@g";
  var eventId_true = eventId.split("@google.com")[0];
  var editCalBase = "https://calendar.google.com/calendar/r/eventedit/";
  
  var calString = eventId_true + " " + calId;
  
  var encoded = Utilities.base64Encode(calString);
  
  var url = editCalBase + encoded;
  
  return url;
}

/*
* 
* Send a confirmation email of the request to the requestor.
* 
* @param {string} email - The email address of the person requesting flex time.
* @param {string} name - The name of the person requesting flex time.
* @param {Date} start_date - The first date of the Flex time request.
* @param {Date} end_date - The last date of the Flex time request.
* 
*/

function sendEmailToRequestor(emailAddress, name, start_date, end_date, url) {
  
  var start_date_text = getDateString(start_date);
  var end_date_text = getDateString(end_date);
  //TODO decrement the end date by 1 so that the first day oback in the office is now marked as out.
  
  var title = "Request: " + name + "out (" + start_date_text + "-" + end_date_text +")";
  
  var body = name +",<br><br>We received your request for flex time from "+ start_date_text + "-" + end_date_text + 
    ".<br><br><a href = '" + url +"'>View your flex request.</a>";
  
  var options = {
    cc: "bim@arthur.design", //add David's email.
    htmlBody: body
  };
    
  Logger.log(body);
  
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