var filterMenuTimer = null;
var inputSearch = null;

var ULMenu = function(){
	this.jQObj = null;
	this.launchFilterMenu = false;
	this.loaded = false;
	
	this.get = function (){
		return this.jQObj;
	};
	
	this.set = function (str){
		this.jQObj = $(str);
		return this.jQObj;
	};
	
	this.mask = function (a, b){
		this.jQObj.mask(a, b);
	};
	
	this.isMasked = function (){
		return this.jQObj.isMasked();
	};
	
	this.unmask = function (){
		this.jQObj.unmask();
		if (this.launchFilterMenu){
			filterMenuTimer = setTimeout(function(){filterMenu();}, 300);
			this.launchFilterMenu = false;
		}
		this.loaded = true;
		this.jQObj.trigger('ajaxmenuloaded');
	};
};
ulMenu = new ULMenu();

function loadAjaxMenuTimer(i){
	$.post("ajax/getMenu.php", {i : i}, function(html) {
		if (html != '0'){
			ulMenu.get().append(html);
			i+=1;
			setTimeout(function(){loadAjaxMenuTimer(i);},100);
		}else{
			ulMenu.unmask();
		}
	}, "html").error(function(jqXHR, textStatus) {
		console.log(textStatus);
		console.log(jqXHR.responseText);
		sendMail(textStatus, jqXHR.responseText);
	});
}

function loadAjaxMenu() {
	ulMenu.set("#left_pane ul");
	ulMenu.mask("Loading...");
	setTimeout(function(){loadAjaxMenuTimer(1);},100);
}

function filterMenu(){
	var sTypingText = inputSearch.val().toLowerCase();
	$("#left_pane li").filter(function() {
		//TODO: return /some regex/.test( $(this).text() );
		return $(this).text().toLowerCase().indexOf(sTypingText) >= 0;
	}).show();
	$("#left_pane li").filter(function() {
		return $(this).text().toLowerCase().indexOf(sTypingText) === -1;
	}).hide();
	filterMenuTimer = null;
}
