/* exported gapiLoaded */
/* exported gisLoaded */
/* exported handleAuthClick */
/* exported handleSignoutClick */


const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);


const createMailBtn = $('#createMail_button')
const authorizeBtn = $('#authorize_button')
const signoutBtn = $('#signout_button')
const maiList = $('#mail_list')
const maincontent = $(".maincontent");
const sendMailSec = $(".sendEmailSec")
const closeBtn = $("#close-button")




// TODO(developer): Set to client ID and API key from the Developer Console
const CLIENT_ID = '652378424049-26p6uf7uve24vm8v87l5tr59dapnqtar.apps.googleusercontent.com';
const API_KEY = 'AIzaSyAWQIade7F8wMJQtficOLvprEjv8d7sIOU';

// Discovery doc URL for APIs used by the quickstart
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest';

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
// const SCOPES = 'https://www.googleapis.com/auth/gmail.compose'
const SCOPES = "https://mail.google.com/";

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
        authorizeBtn.innerText = 'Authorize';
        signoutBtn.style.visibility = 'hidden';
        createMailBtn.style.visibility = 'hidden'

        maiList.innerHTML = '';
        mails = [];
        maincontent.innerHTML = ''
    }
}


closeBtn.onclick = function () {
    senMailSec.classList.add("hidden");
    $("#compose-to").value = '';
    $("#compose-subject").value = '';
    $("#compose-message").value = '';
    document.getElementById("file-input").value = "";

}



/**
 * Print all Labels in the authorized user's inbox. If no labels
 * are found an appropriate message is printed.
 */


async function listMessages() {
    maiList.innerHTML = '';
    mails = [];
    maincontent.innerHTML = ''
    var request = gapi.client.gmail.users.messages.list({
        'userId': 'me',
        'labelIds': 'INBOX',
        'maxResults': 10
    })

    request.execute(function (response) {
        var messages = response.result.messages;
        if (messages && messages.length > 0) {
            messages.forEach((message) => {
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
                    li.classList.add("mail_item");

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
    sendMailSec.classList.remove("hidden");
}


//feature/send_attachments

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



function sendEmail() {
    window.event.preventDefault();
    $('#send-button').classList.add("disabled");
    $('.loader').classList.remove("hidden")

    var recipient = $("#compose-to").value;
    var subject = $("#compose-subject").value;
    var message = $("#compose-message").value
    var fileInput = document.getElementById("file-input");
    var file = fileInput.files[0];


    console.log(file === undefined);

    if (!file) {
        var emailContent = {
            to: recipient,
            subject: subject,
            message: message
        };

        var email = '';

        // email += 'From: ' + my_mail + '\r\n';
        email += 'To: ' + emailContent.to + '\r\n';
        email += 'Subject: ' + emailContent.subject + '\r\n';
        email += 'Content-Type: text/plain; charset="UTF-8"\r\n';
        email += '\r\n';
        email += emailContent.message;

        
        try {
            var encodedEmail = btoa(email).replace(/\+/g, '-').replace(/\//g, '_');
        } catch (error) {
            composeTidy();
            alert(error);
            
        }
        console.log(encodedEmail);

        gapi.client.gmail.users.messages.send({
            'userId': 'me',
            'raw': encodedEmail
        }).then(function (response) {
            console.log('Email sent:', response);
            composeTidy();
        }, function (error) {
            console.log('Error sending email:', error);
        });
    }
    else {
        var reader = new FileReader();
        reader.onload = function () {
            var fileContent = reader.result.split(',')[1];

            var boundary = 'boundary-example';

            var emailContent =
                'From: Your Name <your-email@example.com>\r\n' +
                'To: ' + recipient + '\r\n' +
                'Subject: ' + subject + '\r\n' +
                'Content-Type: multipart/mixed; boundary="' + boundary + '"\r\n' +
                '\r\n' +
                '--' + boundary + '\r\n' +
                'Content-Type: text/plain; charset="UTF-8"\r\n' +
                '\r\n' +
                message + '\r\n' +
                '\r\n' +
                '--' + boundary + '\r\n' +
                'Content-Type: ' + file.type + '; name="' + file.name + '"\r\n' +
                'Content-Disposition: attachment; filename="' + file.name + '"\r\n' +
                'Content-Transfer-Encoding: base64\r\n' +
                '\r\n' +
                fileContent + '\r\n' +
                '\r\n' +
                '--' + boundary + '--';

            try {
                var encodedEmail = btoa(emailContent).replace(/\+/g, '-').replace(/\//g, '_');
            } catch (error) {
                composeTidy();
                alert(error);
                
            }
            

            gapi.client.gmail.users.messages.send({
                'userId': 'me',
                'raw': encodedEmail
            }).then(function (response) {
                console.log('Email sent:', response);
                composeTidy();
            }, function (error) {
                console.log('Error sending email:', error);
            });
        };

        reader.readAsDataURL(file);
    }

    
}