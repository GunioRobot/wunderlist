/**
 * sharing.js
 *
 * Class for sharing lists
 * 
 * @author Marvin Labod, Dennis Schneider
 */

var sharing = sharing || {};

/**
 * The init method
 *
 * @author Dennis Schneider
 */
sharing.init = function()
{
	sharing.shareUrl        = 'http://192.168.178.58/share';//'https://sync.wunderlist.net/share';
	sharing.sharedEmailsUrl = 'http://192.168.178.58/share/%s/emails';//'https://sync.wunderlist.net/share/%s/emails';
	sharing.shareListDialog = null;

	sharing.status_codes =
	{
        'SHARE_SUCCESS':    800,
        'SHARE_FAILURE':    801,
        'SHARE_DENIED':     802,
        'SHARE_NOT_EXISTS': 803
    };

	sharing.addedEmail = false;

	// Hitting Enter on Input Field
	$('.input-sharelist').live('keydown', function(event)
	{
		if(sharing.addedEmail == false)
		{
			sharing.addedEmail = true;
			if(event.keyCode == 13)
			{
				var shareList      = $('.sharelistusers');
				var shareListItems = shareList.children('li');

				var email = $(this).val();
				$(this).val("");

				shareList.append('<li><span></span> ' + email + '</li>');

				if(shareListItems.length == 0)
				{
					shareList.before("<p class='invitedpeople'><b>Currently invited people</b></br></p>");
				}
			}
			setTimeout(function() {sharing.addedEmail = false}, 1000);
		}
	});

	// Called on pressed sharing button
	$('div#lists a div.sharep').click(function()
	{
		if(Titanium.Network.online == true)
		{
			sharing.openShareListDialog();
		}
		else
		{
			sharing.openNoInternetShareDialog();
		}
	});

	// Open Share Dialog
	$(".sharep").click(function()
	{
		sharing.openShareListDialog();
	});

	// Delete Button for remove Sharing for a single E-Mail
	$(".dialog-sharelist li span").live("click", function()
	{
		$(this).parent().remove();
		
		var shareListItems = $(".sharelistusers").children("li");
		
		if(shareListItems.length == 0)
		{
			$("p.invitedpeople").remove();
		}
	});

	sharing.sendInvitation = false;

	// Send the invitation
	$('#send_share_invitation').live('click', function()
	{
		if(sharing.sendInvitation == false)
		{
			sharing.sendInvitation = true;
			sharing.shareLists();
			//sharing.getSharedEmails();
			closeDialog(sharing.shareListDialog);
			
			setTimeout(function() {sharing.sendInvitation = false}, 5000);
		}
	});
}

/**
 * Share the list to the given emails
 *
 * @author Dennis Schneider
 */
sharing.shareLists = function()
{
	list_id              = $('div#lists a.ui-state-disabled').attr('id');
	var $emails          = $('.sharelistusers li');
	var collected_emails = new Array();

	$emails.each(function(key, value)
	{
		var email = $.trim($(value).text());
		collected_emails.push(email);
	});

	var data         = {};
	user_credentials = wunderlist.getUserCredentials();
	data['email']    = user_credentials['email'];
	data['password'] = user_credentials['password'];
	data['list_id']  = wunderlist.getOnlineIdByListId(list_id);
	data['add']	     = collected_emails;
	data['delete']   = new Array();

	$.ajax({
		url: sharing.shareUrl,
		type: 'POST',
		data: data,
		beforeSend: function()
		{
			// Show loading indicator on invitation dialog
		},
		success: function(response_data, text, xhrobject)
		{
			console.log(response_data);
			if(response_data != '' && text != '' && xhrobject != undefined)
			{
				if(xhrobject.status == 200)
				{
					var response = eval('(' + response_data + ')');

					switch(response.code)
					{
						case sharing.status_codes.SHARE_SUCCESS:
							sharing.shareSuccess(response);
							console.log(response);
							break;

						case sharing.status_codes.SHARE_FAILURE:
							showErrorDialog(language.data.share_failure);
							break;

						case sharing.status_codes.SHARE_DENIED:
							showErrorDialog(language.data.share_denied);
							break;

						case sharing.status_codes.SHARE_NOT_EXIST:
							showErrorDialog(language.data.sync_not_exist);
							break;

						default:
							showErrorDialog(language.data.error_occurred);
							break;
					}
				}
			}
		},
		error: function(xhrobject)
		{
			showErrorDialog(language.data.sync_error);
		}
	});
}

/**
 * When the sharing request was successful
 *
 * @author Dennis Schneider
 */
sharing.shareSuccess = function(response)
{
	// Do stuff with the response
}

/**
 * Get the emails for the shared list from the server
 *
 * @author Dennis Schneider
 */
sharing.getSharedEmails = function()
{
	var data         = {};
	user_credentials = wunderlist.getUserCredentials();
	data['email']    = user_credentials['email'];
	data['password'] = user_credentials['password'];

	list_id  = $('div#lists a.ui-state-disabled').attr('id');
	list_id  = wunderlist.getOnlineIdByListId(list_id);
	emailUrl = sharing.sharedEmailsUrl.split('%s').join(list_id);

	$.ajax({
		url: emailUrl,
		type: 'POST',
		data: data,
		beforeSend: function()
		{
			// Show loading indicator on invitation dialog
		},
		success: function(response_data, text, xhrobject)
		{
			if(response_data != '' && text != '' && xhrobject != undefined)
			{
				if(xhrobject.status == 200)
				{
					var response = eval('(' + response_data + ')');

					switch(response.code)
					{
						case sharing.status_codes.SHARE_SUCCESS:
							// @TODO FILL DIALOG WITH EMAIL ADDRESSES
							console.log(response);
							break;

						case sharing.status_codes.SHARE_FAILURE:
							showErrorDialog(language.data.share_failure);
							break;

						case sharing.status_codes.SHARE_DENIED:
							showErrorDialog(language.data.share_denied);
							break;

						case sharing.status_codes.SHARE_NOT_EXIST:
							showErrorDialog(language.data.sync_not_exist);
							break;

						default:
							showErrorDialog(language.data.error_occurred);
							break;
					}
				}
			}
		},
		error: function(xhrobject)
		{
			showErrorDialog(language.data.sync_error);
		}
	});
}

/**
 * Open Sharing Dialog
 *
 * @author Marvin Labod
 */
sharing.openShareListDialog = function()
{
	if(sharing.shareListDialog == undefined)
	{
		sharing.shareListDialog = generateDialog('Share List', generateShareListDialogHTML(), 'dialog-sharelist')
	}
	openDialog(sharing.shareListDialog);
}

/**
 * Open a dialog when no internet connection is available
 *
 * @author Dennis Schneider
 */
sharing.openNoInternetShareDialog = function()
{
	showErrorDialog('Sharing is only possible if you have an active internet connection');
}

// Load on start
$(function() {
	sharing.init();
});