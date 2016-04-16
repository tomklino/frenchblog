$(function() {
	var listenForChanges = false;
	var content = $("#content");
	var i = 0;

	console.log($(".server_content"));

	$(".server_content").each((i, elem) => {
        $.ajax({
			method: "GET",
			url: "contents/" + elem.id
		}).done((data) => {
			elem.innerHTML = data;
			$(elem).dblclick(() => {
				makeEditable($(elem));
			});
		}).fail((jqXHR, textStatus) => {
			if(jqXHR.status == 404) {
				$(elem).dblclick(() => {
					makeEditable($(elem));
				});
			}
		});
	});
/*
	content.dblclick(() => {
		console.log(content);
		makeEditable(content);
	});
*/
	//TODO: for each div in the page with class "server_content" load content with ajax request
    //TODO: after each such request returns, add a double click listener to make them editable and listen to changes.
});

function unmakeEditable(jqelem) {
	jqelem.attr("contentEditable", "false");
	jqelem.off("input");
}

function makeEditable(jqelem) {
	var i = 0;
	var netData = $("#network_data");
	var toSaveTimeout = undefined;

	jqelem.attr("contentEditable", "true");
	jqelem.on("input", () => {
		i++;
		netData.html("content changed " + i);

		if(toSaveTimeout) {
			clearTimeout(toSaveTimeout);
		}
		toSaveTimeout = setTimeout(() => {
			$.ajax({
				method: "POST",
				data: {
					action: "edit_content",
					section: jqelem.get(0).id,
					content: jqelem.html()
				}
			}).done(() => {
				netData.html("Saved");
			}).fail(() => {
				netData.html("Error while saving");
			});
		}, PBGlobals.timeToSave);
	});

	$(document).click(() => {
		unmakeEditable(jqelem);
		$(document).off("click");
		jqelem.off("click");
	});

	jqelem.click((e) => {
		e.stopPropagation();
	});
}
