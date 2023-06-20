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
const SCOPES = 'https://www.googleapis.com/auth/gmail.compose'

let tokenClient;
let gapiInited = false;
let gisInited = false;

createMailBtn.style.visibility = 'hidden';
authorizeBtn.style.visibility = 'hidden';
signoutBtn.style.visibility = 'hidden';
$('.loader').classList.add("hidden")

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
        await listMessages();
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


async function listMessages() {
    var request = gapi.client.gmail.users.messages.list({
        'userId': 'me',
        'labelIds': 'INBOX',
        'maxResults': 10
    })

    request.execute(function (response) {
        var messages = response.result.messages;
        if (messages && messages.length > 0) {
            messages.forEach((message, index) => {
                gapi.client.gmail.users.messages.get({
                    'userId': 'me',
                    'id': message.id
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
                    li.textContent = `${messageContent.sender} - ${messageContent.subject}`;

                    li.dataset.index = String(mails.length - 1);

                    // Thêm thuộc tính có thể bấm cho phần tử li
                    li.style.cursor = 'pointer';

                    maincontent.innerHTML = "<p>" + mails[0].body + "</p>"

                    li.onclick = function () {
                        let index = this.dataset.index
                        console.log('Clicked on sender:', this.dataset.index);
                        maincontent.innerHTML = "<p>" + mails[index].body + "</p>"
                    }

                    // Thêm phần tử li vào một phần tử gốc
                    maiList.appendChild(li);


                }).catch(function (error) {
                    console.error('Error getting message: ', error);
                });
            });

        } else {
            maiList.innerHTML = "<p> No messages found.</p>";
        }


    })
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


    body = getBody(message.payload)

    return {
        subject: subject,
        sender: sender,
        body: body
    };
}



function getBody(message) {
    var encodedBody = '';
    if (typeof message.parts === 'undefined') {
        encodedBody = message.body.data;
    }
    else {
        encodedBody = getHTMLPart(message.parts);
    }
    encodedBody = encodedBody.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '');
    return decodeURIComponent(escape(window.atob(encodedBody)));
}

function getHTMLPart(arr) {
    for (var x = 0; x <= arr.length; x++) {
        if (typeof arr[x].parts === 'undefined') {
            if (arr[x].mimeType === 'text/html') {
                return arr[x].body.data;
            }
        }
        else {
            return getHTMLPart(arr[x].parts);
        }
    }
    return '';
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



//feature/send_attachments
function sendMail() {
    window.event.preventDefault();
    $('#send-button').classList.add("disabled");
    $('.loader').classList.remove("hidden")

    var to = $("#compose-to").value;
    var subject = $("#compose-subject").value;
    var message = $("#compose-message").value
    var file = document.getElementById("file-input").files[0];

    if (file) {
        var reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function () {
            var attachment = reader.result.split(",")[1];
            var boundary = "my_email_boundary";
            var nl = "\r\n";
            var attachmentContent = btoa(attachment);
            var attachmentName = file.name;
            var attachmentType = file.type;
            var messageBody = nl + nl + message;
            var mime = [
                "MIME-Version: 1.0",
                "To: " + to,
                "Subject: " + subject,
                'Content-Type: multipart/mixed; boundary="' + boundary + '"',
            ].join(nl);
            var body = [
                "--" + boundary,
                'Content-Type: text/plain; charset="UTF-8"',
                "Content-Transfer-Encoding: 7bit",
                "",
                messageBody,
                "",
                "--" + boundary,
                "Content-Type: " + attachmentType + '; name="' + attachmentName + '"',
                'Content-Disposition: attachment; filename="' + attachmentName + '"',
                "Content-Transfer-Encoding: base64",
                "",
                attachmentContent,
                "",
                "--" + boundary + "--",
            ].join(nl);

            var encodedMessage = btoa(mime + nl + nl + body);

            var request = gapi.client.gmail.users.messages.send({
                userId: "me",
                resource: {
                    raw: encodedMessage,
                },
            });
            request.execute(composeTidy);
        };
    } else {
        alert("xit")
    }


};


function composeTidy() {
    console.log("Đã gửi mail:");
    $('.loader').classList.add("hidden")
    alert("Đã gửi mail!");
    $("#compose-to").value = ''
    $("#compose-subject").value = ''
    $("#compose-message").value = ''
    document.getElementById("file-input").value = "";
    $('#send-button').classList.remove('disabled');
   
}
