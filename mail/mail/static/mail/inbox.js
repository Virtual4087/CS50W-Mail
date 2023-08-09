document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', () => compose_email(false));

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email(reply) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email_page-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  const to = document.querySelector('#compose-recipients');
  const subject = document.querySelector('#compose-subject');
  const body = document.querySelector('#compose-body');

  if (!reply){
    // Clear out composition fields
    to.value ='';
    to.disabled = false;
    subject.value = '';
    subject.disabled = false;
    body.value = '';
  }

  document.querySelector('#compose-form').onsubmit = () => {
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: to.value,
          subject: subject.value,
          body: body.value,
      })
    })
    .then(response => {
      if (response.ok){
        alert("Successfull");
        load_mailbox('sent');
      }
      if (response.status == 400){
        alert("wrong email address")
        to.focus();
      }
    })
    return false
  }
}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#email_page-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    emails.forEach(email => {
      const div = document.createElement('div');
      div.setAttribute('id', `n${email.id}`);
      div.classList.add('emails_container');
      if (mailbox == 'sent'){
        div.innerHTML = `<div class="to"><b>To: </b>${email.recipients}</div>
        <div class="subject"><b>Subject: </b>${email.subject}</div>
        <div class="date">${email.timestamp}</div>`;
      }
      else{
        div.innerHTML = `<div class="from"><b>From: </b>${email.sender}</div>
        <div class="subject"><b>Subject: </b>${email.subject}</div>
        <div class="date">${email.timestamp}</div>`;
      }
      document.querySelector('#emails-view').append(div);
      if (email.read){
        div.style.background = '#cccccc';
      }
      document.querySelector(`#n${email.id}`).addEventListener('click', () => {
        load_mailpage(email.id, mailbox);
      })
    })
  });
}

function load_mailpage(mail_id, mailbox){
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email_page-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
 
  fetch(`/emails/${mail_id}`)
  .then(response => response.json())
  .then(email => {

    // Marking the email as read
    if (!email.read){
      fetch(`/emails/${mail_id}`, {
        method : 'PUT',
        body : JSON.stringify({
          read : true
        })
      })
    }
    
    document.querySelector('#from').innerHTML = `<b>From: </b>${email.sender}`;
    document.querySelector('#to').innerHTML = `<b>To: </b>${email.recipients}`;
    document.querySelector('#subject').innerHTML = `<b>Subject: </b>${email.subject}`;
    document.querySelector('#date').innerHTML = email.timestamp;
    document.querySelector('#body').innerHTML = email.body;
    const archive = document.querySelector('#archive');
    const reply = document.querySelector('#reply');

    // Makes the archive button invisible for emails sent by the user
    if (mailbox == 'sent'){
      archive.style.display = 'none';
      reply.style.display = 'none';

    }
    else{
      archive.style.display = 'block';
      reply.style.display = 'block';
    }

    //Setting up the archive button
    if (!email.archived){
      archive.innerHTML = "Archive";
    }
    else{
      archive.innerHTML = "Unarchive";
    }
    archive.onclick = () => {
      if (!email.archived){
        fetch(`/emails/${mail_id}`, {
          method : 'PUT',
          body : JSON.stringify({
            archived : true
          })
        })
        .then(() => {
          load_mailbox('inbox');
        });
      }
      else{
        fetch(`/emails/${mail_id}`, {
          method : 'PUT',
          body : JSON.stringify({
            archived : false
          })
        })
        .then(() => {
          load_mailbox('inbox');
        });
      } 
    }

    // Setting up the reply button
    reply.onclick = () => {
      console.log(123)
      const to = document.querySelector('#compose-recipients');
      const subject = document.querySelector('#compose-subject');
      const body = document.querySelector('#compose-body');
      to.value = email.sender;
      to.disabled = true;
      if (email.subject.startsWith("Re:")){
        subject.value = email.subject;
      }
      else{
        subject.value = `Re: ${email.subject}`;
      }
      subject.disabled = true;
      body.value = `-On ${email.timestamp} ${email.sender} wrote: ${email.body}`;
      compose_email(true);
    }
  })
}