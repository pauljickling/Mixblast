var search = function(query,counter) {
	var q = query;
	var c = counter;

	var request = gapi.client.youtube.search.list({
	q: q,
	part: 'snippet',
	maxResults: 20
	//order: 'viewCount'
	});
  
  request.execute(function(response) {
	var searchObj = response.result;
	//these arrays will hold the top 20 results of each one in the loop
	var vIdArr=[], vTitleArr=[], vThumbArr=[];
	if (!searchObj) { console.log('bad search: '+c); }

	$.each(searchObj.items, function(i,x) {
		var vId = x.id.videoId;
		var vTitle = x.snippet.title;
		var vThumb = x.snippet.thumbnails.default.url;
		if (vId===undefined) {
			vId="Not Found"; vTitle="Not Found. Try version refresh button: "; vThumb="img/notfound.png"; 
		}

		vIdArr.push(vId);
		vTitleArr.push(vTitle);
		vThumbArr.push(vThumb);
		//global object of all the song results
		search.vidObjArray[c] = {
			vid:vIdArr,
			title:vTitleArr, 
			thumb:vThumbArr
		};

		//display list, use only first result of each
		if (i === 0) {
			renderPlaylist(c,vThumb,vId,vTitle);
			
			search.topvIdArray.push(vId);	
			search.topvTitleArray.push(vTitle);
			search.topvThumbArray.push(vThumb);
			//start the first video right away while the playlist loads

			if (search.topvIdArray.length == 1) {
				//only cue on the first search, keep the video running on subsequent searches
				//////if (count==1) cuePlayer();
				if (search.count==1) loadVid(search.topvIdArray[0], 0, "medium"); //ok nevermind, let's autoplay instead of cue
			} 

			c++;
		}
	});
  });	
};


function multiSearch() {
	//this toggles some edit playlist stuff
	editSearchTerm(0);
	search.vidObjArray = {}; //, search.prev_vidObjArray = {};
	search.topvIdArray = []; search.topvTitleArray =[]; search.topvThumbArray = []; search.listArray = [];
	search.vidcount = 0; search.playcount = 0; search.done = false;
	if (!search.count) search.count = 0;
	//show video player
	$('#player-container').show();
	$('#button-container').show();
	//erase previous search
	$( "#search-container" ).empty();
	$('#errormsg').hide();
	$('#youtube-playlist-container').show();
	$('#ytPlayer-thumb-close').show();
	$("#shuffletext").hide();
	//$("#closebutton-thumb").html("<img src='"+ search.topvThumbArray[0] +"' id='thumb'>"); 
	if (search.topvIdArray) {
		search.topvIdArray.length = 0; search.topvTitleArray.length = 0; search.topvThumbArray.length = 0;
		search.listArray.length = 0;
	}
	pastBlasts.add($('#query').val());
	//var mobile_width = 666;
	//if ($(window).width() < mobile_width) $("#pb-icon" ).hide();

	//split texarea into lines
	var lines = $('#query').val().split(/\n/);
	//only get non-whitespace lines, push into listArray
	for (var i=0; i < lines.length; i++) {
	  if (/\S/.test(lines[i])) {
		search.listArray.push($.trim(lines[i]));
	  }
	}
	
	var x = 0;
	var searchnum = search.listArray.length;
	if ((searchnum < 1) || (search.listArray[0] == 'Search Youtube for a list of songs.')) { 
		$('#errormsg').show();
		$('#errormsg').html('Put a list of songs into the textbox. <br>(Load songs by artist, copy and paste a text list, load an RSS Feed, or type)');
		editSearchTerm(0); 
		return false; 
	}

	//$("#query").animate({height:'200px'},200);
	//$("#logo").animate({height:'0px',width:'100%',marginBottom:'20px'});

	(function setInterval_afterDone(){

		/* do search function */
		if (search.listArray[x]) { search(search.listArray[x],x); }// else { console.log('error: ILB'); return false;}
		
		x++;
		
		//if(ready2search==true) waittime = 300; //wait for player to animate in
		
		var waittime = 600; 
		var timerId = setTimeout(setInterval_afterDone, waittime);
		if(x==searchnum) {
			//ready the playlist button
			$('#playlist-button').attr('disabled', false);
			$("#shufflebutton").removeClass("disabled");

			search.done = true;
			//ytPlayer.cuePlaylist(search.topvIdArray);
			/////todo: start with vidObjArray[vidcount].vid[0]

			clearTimeout(timerId);
		}
	})();
	search.count++;
}
function similarTrackPlaylist(artistName,trackName) {
	var song_num = $("#topSongs-num").val();
	//$('#query').val('Loading list: '+ song_num +' videos by '+ artistName + '...');
	//$("#related-container" ).show();
	//showRelated(artistName);
	 $.getJSON("http://ws.audioscrobbler.com/2.0/?method=track.getsimilar&artist="+artistName+"&track="+trackName+"&autocorrect=1&api_key=946a0b231980d52f90b8a31e15bccb16&limit="+ song_num +"&format=json&callback=?", function(data) {
		if (!songlist) var songlist = '';
		//if ((data.similartracks != undefined) && (data.similartracks.track != undefined)) {
			$.each(data.similartracks.track, function(i, item) {
				songlist += artistName + " - " + item.name + "\n";
			});
			////////////experimental version in use/////////
			$('#query').val($('#query').val() + songlist);
			//$('#query').val(songlist);
			 //$('#search-button').trigger( "click" );
		//} else {
		//	$('#query').val(': ( \n\nError loading videos by: '+artistName+'\n\nCheck spelling?'); 
		//}
	});	
}
function allSongsBy(artistName) {
	var song_num = $("#topSongs-num").val();
	//$('#query').val('Loading list: '+ song_num +' videos by '+ artistName + '...');
	$("#related-container" ).show();
	showRelated(artistName);
	 $.getJSON("http://ws.audioscrobbler.com/2.0/?method=artist.gettoptracks&artist="+artistName+"&autocorrect=1&api_key=946a0b231980d52f90b8a31e15bccb16&limit="+ song_num +"&format=json&callback=?", function(data) {
		if (!songlist) var songlist = '';
		if ((data.toptracks != undefined) && (data.toptracks.track != undefined)) {
			$.each(data.toptracks.track, function(i, item) {
				songlist += artistName + " - " + item.name + "\n";
			});
			////////////experimental version in use/////////
			$('#query').val($('#query').val() + songlist);
			//$('#query').val(songlist);
			 //$('#search-button').trigger( "click" );
		} else {
			$('#query').val(': ( \n\nError loading videos by: '+artistName+'\n\nCheck spelling?'); 
		}
	});

}
$("#topSongs-artist, #topSongs-num").keypress(function (e) {
 var key = e.which;
 if(key == 13) {
	allSongsBy($("#topSongs-artist").val());
	$('#query').val('');
	$("#ui-id-1").hide();
	//return false;  
 }
});  
$("#topSongs-artist").click(function(){
	$(this).focus();$(this).select();this.setSelectionRange(0, 9999);
});
$("#mixbuilder-search-button").click(function(){
	allSongsBy($("#topSongs-artist").val());
	$('#query').val('');
});

function showRelated(artistName) {
	 $.getJSON("http://ws.audioscrobbler.com/2.0/?method=artist.getsimilar&artist=" + artistName + "&limit=40&autocorrect=1&api_key=946a0b231980d52f90b8a31e15bccb16&format=json", function(data) {
	 	var curArtist;
		var artistList = '';
		if (data.similarartists) {
			$.each(data.similarartists.artist, function(i, item) {
				if (item.name) {
					curArtist = item.name.replace(/["']/g, "\\'");
				} else {
					$("#related-container").html("<br><hr class='similar-top'>Error loading related artists: "+artistName); 
				}
				artistList += '<a class="similar-artistButton" href="javascript:void(0);" onclick="$(\'#topSongs-artist\').val(\''+ curArtist +'\');allSongsBy(\''+ curArtist +'\');return false;">' + item.name + '</a>';
				if (i < data.similarartists.artist.length-1) artistList += " ";
			});
			$("#related-container").html("<br><hr class='similar-top'><span id='similarArtTitle'>Add Songs By Similar Artists:</span> "+artistList);
		} else {
			$("#related-container").html("<br><hr class='similar-top'>Error loading related artists: "+artistName); 
		}
	});
}

$("#shuffletext").click(function(){
	var lines = $('#query').val().split("\n");
	shuffle(lines);
	//var randomlines = lines.join("\n");
	var randomlines = '';
	for (var i=0; i < lines.length; i++) {
		if (/\S/.test(lines[i])) {
			randomlines += lines[i] + '\n';
			//if (i != lines.length) randomlines += '\n';
		}
	}
	//randomlines = randomlines.replace(/^(\r\n)|(\n)/,'');
	$('#query').val(randomlines);

});


$("#editplaylist").click(function(){
	editSearchTerm(0);
});
$("#ytPlayer-thumb-close").click(function(){
	editSearchTerm(0);
});
$("#closeAdvanced").click(function(){
	$('#advanced-container').slideToggle("fast");
});

function editSearchTerm(lineNumber) {
	var mobile_width = 795, vidTop = '-72px', vidWidth = '100%', thumbTop = '0px', queryHeight = '222px';
	if ($(window).width() < mobile_width) { 
		queryHeight = '170px';
		vidTop = '-100px'; vidWidth = '100%'; thumbTop = '0px'; 
	}
	var toggleEditText = $("#editplaylist").html();
	if (toggleEditText.indexOf("Edit Playlist") > -1) {
		$("#editplaylist").html(toggleEditText.replace("Edit Playlist","Close Editor"));
		$("#player-container").animate({top: thumbTop, right: '21px', width: '95px', height: '71px'}, 'fast');
		$('#query').animate({height: '345px'}, 'fast');
		$("#related-container").show();
		$("#ytPlayer-thumb-close").show();
		$("#blast-button-container").css("visibility", "visible");
		$("#shuffletext").show();
	} else if (toggleEditText.indexOf("Close Editor") > -1) {
		$("#editplaylist").html(toggleEditText.replace("Close Editor","Edit Playlist"));
		$('#player-container').animate({top: vidTop, right: '0px', width: vidWidth, height: '364px'}, 'fast');
		$('#query').animate({height: queryHeight}, 'fast');
		$("#related-container").hide();
		$("#ytPlayer-thumb-close").hide();
		$("#blast-button-container").css("visibility", "hidden");
		$("#shuffletext").hide();
	}
	/*
	var input = $("#query");
	var lineHeight = 1.14;
	input.scrollTop(lineNumber * lineHeight);
	window.scrollTo(0, 0);
	*/
}

$(document).keydown(function(e) {
	//allow arrow keys if an input is focused
	if($("input,textarea").is(":focus")) return; 

	switch(e.which) {
		case 37: nextVideo(false);// left
		break;

		case 192: editSearchTerm(0);// `
		return;

		case 39: nextVideo(true);// right
		break;

		case 32: playPause();// space
		e.preventDefault();
		break;

		default: return; // exit this handler for other keys
	}
	//e.preventDefault(); // prevent the default action (scroll / move caret)
});