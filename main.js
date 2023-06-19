/* exported gapiLoaded */
/* exported gisLoaded */
/* exported handleAuthClick */
/* exported handleSignoutClick */


const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);


const createMailBtn = $('#createMail_button')
const authorizeBtn = $('#authorize_button')
const signoutBtn = $('#signout_button')
const labelsSec = $('#labels_section')
const maiList = $('#mail_list')
const maincontent = $(".maincontent");
const senMailSec = $(".sendEmailSec")
const closeBtn = $("#close-button")



// TODO(developer): Set to client ID and API key from the Developer Console
const CLIENT_ID = '652378424049-26p6uf7uve24vm8v87l5tr59dapnqtar.apps.googleusercontent.com';
const API_KEY = 'AIzaSyAWQIade7F8wMJQtficOLvprEjv8d7sIOU';

// Discovery doc URL for APIs used by the quickstart
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest';

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = 'https://mail.google.com/ https://www.googleapis.com/auth/gmail.addons.current.message.action https://www.googleapis.com/auth/gmail.addons.current.message.metadata https://www.googleapis.com/auth/gmail.addons.current.message.readonly https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.readonly'

let tokenClient;
let gapiInited = false;
let gisInited = false;

createMailBtn.style.visibility = 'hidden';
authorizeBtn.style.visibility = 'hidden';
signoutBtn.style.visibility = 'hidden';

/**
 * Callback after api.js is loaded.
 */
function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}

/**
 * Callback after the API client is loaded. Loads the
 * discovery doc to initialize the API.
 */
async function initializeGapiClient() {
    await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: [DISCOVERY_DOC],
    });
    gapiInited = true;
    maybeEnableButtons();
}

/**
 * Callback after Google Identity Services are loaded.
 */
function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        immediate: true,
        callback: '', // defined later
    });
    gisInited = true;
    maybeEnableButtons();
}




/**
 * Enables user interaction after all libraries are loaded.
 */
function maybeEnableButtons() {
    if (gapiInited && gisInited) {
        authorizeBtn.style.visibility = 'visible';
    }
}




var mails = [

]


authorizeBtn.onclick = function handleAuthClick() {
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            throw (resp);
        }
        createMailBtn.style.visibility = 'visible';
        signoutBtn.style.visibility = 'visible';
        authorizeBtn.innerText = 'Refresh';
        await listLabels();
    };

    if (gapi.client.getToken() === null) {
        // Prompt the user to select a Google Account and ask for consent to share their data
        // when establishing a new session.
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        // Skip display of account chooser and consent dialog for an existing session.
        tokenClient.requestAccessToken({ prompt: '' });
    }
}

signoutBtn.onclick = function handleSignoutClick() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken('');
        labels.innerText = '';
        authorizeBtn.innerText = 'Authorize';
        signoutBtn.style.visibility = 'hidden';
    }
}




/**
 * Print all Labels in the authorized user's inbox. If no labels
 * are found an appropriate message is printed.
 */

async function listLabels() {
    let response;
    try {
        response = await gapi.client.gmail.users.labels.list({
            'userId': 'me',
        });
    } catch (err) {
        labelsSec.innerText = err.message;

        return;
    }

    const labels = response.result.labels;
    if (!labels || labels.length == 0) {
        labelsSec.innerText = 'No labels found.';
        return;
    }
    // Flatten to string to display
    const output = labels.reduce(
        (str, label) => str + `<li> ${label.name} </li>\n`,
        'Labels:\n');
    // console.log(output)
    labelsSec.innerHTML = output;
    // nam
    listMessages();
}

function listMessages() {
    gapi.client.gmail.users.messages.list({
        'userId': 'me',
        'labelIds': 'INBOX',
        'maxResults': 10
    }).then(function (response) {
        var messages = response.result.messages;
        if (messages && messages.length > 0) {
            for (let i = messages.length - 1; i >= 0; i--) {
                // Get the ID of the first message
                getMessage(messages[i].id, i); // Get the content of the message
            }

        } else {
            maiList.innerHTML = "<p> No messages found.</p>";
        }

        // getMessage("188c54a78d178d10");

    }).catch(function (error) {
        console.error('Error listing messages: ', error);
    });
}

// Get the content of a specific message
function getMessage(messageId, index) {
    gapi.client.gmail.users.messages.get({
        'userId': 'me',
        'id': messageId
    }).then(function (response) {
        var message = response.result;
        // console.log((message))
        var messageContent = parseMessageContent(message); // Parse the message content
        // console.log("content", JSON.stringify(messageContent, null, 2))
        // var messageObject = JSON.stringify(messageContent, null, 2);
        mails.push(messageContent);
        console.log(mails)

        var li = document.createElement('li');

        // Sử dụng textContent để gán nội dung vào phần tử li
        li.textContent = `${messageContent.sender.slice(1, -1)} - ${messageContent.subject}`;

        li.dataset.index = String(mails.length - 1);

        // Thêm thuộc tính có thể bấm cho phần tử li
        li.style.cursor = 'pointer';

        // Gán sự kiện click cho phần tử li
        // li.addEventListener('click',  () => {
        //     // Xử lý sự kiện khi phần tử li được bấm
        //     console.log('Clicked on sender:', this.dataset.index);
        // });

        li.onclick = function () {
            let index = this.dataset.index
            console.log('Clicked on sender:', this.dataset.index);
            maincontent.innerHTML = "<p>" + mails[index].body + "</p>"
        }

        // Thêm phần tử li vào một phần tử gốc
        maiList.appendChild(li);



        // maiList.innerHTML = maiList.innerHTML + "<li>"  + messageContent.sender + "</li> \n" ;
        // `<li> ${messageContent.sender.slice(1,-1)} - ${messageContent.subject} </li> \n`
        // console.log(maiList.innerHTML);


    }).catch(function (error) {
        console.error('Error getting message: ', error);
    });
}

// Parse the content of the message
function parseMessageContent(message) {
    var headers = message.payload.headers;
    var subject, sender, body;

    for (var i = 0; i < headers.length; i++) {
        if (headers[i].name === 'Subject') {
            subject = headers[i].value;
        }
        if (headers[i].name === 'From') {
            sender = headers[i].value;
        }
    }

    if (message.payload.parts && message.payload.parts.length > 0) {
        body = decodeURIComponent(
            escape(window.atob(message.payload.parts[0].body.data.replace(/-/g, "+").replace(/_/g, "/")))
        );
    }

    console.log(message);




    return {
        subject: subject,
        sender: sender,
        body: body
    };
}




createMailBtn.onclick = function () {
    senMailSec.classList.remove("hidden");
}




function sendEmail() {
    $('#send-button').classList.add("disabled")
    sendMessage(
        {
            'To': $("#compose-to").value,
            'Subject': $("#compose-subject").value
        },
        $("#compose-message").value,
        composeTidy
    );

      return false;
}

function sendMessage(headers_obj, message, callback) {
    var email = '';

    for (var header in headers_obj)
        email += header += ": " + headers_obj[header] + "\r\n";

    email += "\r\n" + message;

    var sendRequest = gapi.client.gmail.users.messages.send({
        'userId': 'me',
        'resource': {
            'raw': window.btoa(email).replace(/\+/g, '-').replace(/\//g, '_')
        }
    });

    return sendRequest.execute(callback);
}

closeBtn.onclick = function () {
    senMailSec.classList.add("hidden")
}

function composeTidy() {

    $("#compose-to").value = ''
    $("#compose-subject").value = ''
    $("#compose-message").value = ''    
    $('#send-button').classList.remove('disabled');
}

