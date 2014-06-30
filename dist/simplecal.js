;(function ($, window,document){

	"use strict";

	var	$window = window.app && window.app.$window || $(window),
		$document = window.app && window.app.$document || $(document),
		$body = window.app && window.app.$body || $('body'),
		isTouch = !!('ontouchstart' in window) || !!('onmsgesturechange' in window),
		instanceCounter = 0,
		slice = Array.prototype.slice,
		cellClassPrefix = 'scDate-',

		formatRE = /,|\.|-| |\/|\\/,
		dayRE = /d/gi,
		monthRE = /m/gi,
		yearRE = /y/gi,

	memoize = function(func, hasher) {

		var memo = {};
		hasher || (hasher = function(value){ return value; });
		return function() {
			var key = hasher.apply(this, arguments);
			return Object.prototype.hasOwnProperty.call(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
		};

  	},

	paddNum = memoize(function(num, padsize) {

		if ( num.toString().length > padsize ) { return num; }
		else { return new Array( padsize - num.toString().length + 1 ).join('0') + num; }

	}, function(a,b){ return a + ':' + b; }),

	daysInMonth = function(month, year) {

		return new Date(year, month, 0).getDate();

	},

	isValidDate = function(date) {

		var d = new Date(date.year, date.month - 1, date.day);
		return d && (d.getMonth() + 1) === date.month && d.getDate() === Number(date.day);

	},

	getDateVarsFromString = memoize(function(dateString, dateFormat){

		var formatSplitter = dateFormat.match( formatRE )[0];

		// Get vars according to date format
		var vars = {};
		var dateArr = dateString.split(formatSplitter);
		var formatArr = dateFormat.split(formatSplitter);

		if ( dateArr.length !== 3 || formatArr.length !== 3 ) { return false; }

		for ( var i = 0; i<3; i++ ){

			if ( formatArr[i].match( dayRE ) ) { vars.day = parseInt(dateArr[i],10); continue; }
			if ( formatArr[i].match( monthRE ) ) { vars.month = parseInt(dateArr[i],10); continue; }
			if ( formatArr[i].match( yearRE ) ) { vars.year = parseInt(dateArr[i],10); }

		}

		if (!isValidDate(vars)) { return false; }

		return vars;

	}, function(a,b){ return a+':'+b; }),

	formatDateToString = memoize(function(day, month, year, dateFormat){

		var dateString = dateFormat;

		dateString = dateString.replace(/d+/i, paddNum( day, dateString.match( dayRE ).length ) );
		dateString = dateString.replace(/m+/i, paddNum( month, dateString.match( monthRE ).length ) );
		dateString = dateString.replace(/y+/i, paddNum( year, dateString.match( yearRE ).length ) );

		return dateString;

	}, function(){ return slice.call(arguments,0).join(":"); });

	// Constructor

	function Simplecal(input, options) {

		this.options = $.extend({}, $.simplecal.defaults, options);
		this.input = input;
		this.$input  = $(input);

		if ( this.options.disableWhenTouch && isTouch && this.$input.attr('type') === 'date' ) { return; }

		this.init();

	}

	// Utility methods

	Simplecal.getDateVars = function(date, dateFormat) {

		if ( date instanceof Date ){ return { day: date.getDate(), month: date.getMonth() + 1, year: date.getFullYear() }; }
		if ( !dateFormat ) { dateFormat = this.options.dateFormat; }

		return getDateVarsFromString(date, dateFormat);

	};

	Simplecal.formatDate = function( date, dateFormat ){

		if ( date instanceof Date ){ date = { day: date.getDate(), month: date.getMonth() + 1, year: date.getFullYear() }; }
		if ( !dateFormat ) { dateFormat = this.options.dateFormat; }

		return formatDateToString(date.day, date.month, date.year, dateFormat);

	};

	Simplecal.getHtml = memoize(function(forMonth, forYear) {


		var dayOfTheWeek = new Date(forYear, forMonth-1, 1).getDay();
		if ( dayOfTheWeek === 0 ) { dayOfTheWeek = 7; }

		var nextMonthDate = new Date(forYear, forMonth, 1),
			prevMonthDate = new Date(forYear, forMonth - 2, 1),
			nextMonthNum = nextMonthDate.getMonth() + 1,
			nextMonthYearNum = nextMonthDate.getFullYear(),
			prevMonthNum = prevMonthDate.getMonth() + 1,
			prevMonthYearNum = prevMonthDate.getFullYear();

		var rows_html = '<tr>',
			days_in_month_before = 0,
			days_in_month_num = daysInMonth(forMonth, forYear),
			day = 1;

		// Fill empty cells at beginning
		if ( forMonth-1 < 1 ) {
			days_in_month_before = daysInMonth(12, forYear-1);
		} else {
			days_in_month_before = daysInMonth(forMonth-1, forYear);
		}

		for( var n=1; n<dayOfTheWeek; n++ ) {
			rows_html += '<td><span class="'+ this.options.calendar_class +'_disabled">'+ (days_in_month_before - dayOfTheWeek + n + 1) +'</span></td>';
		}

		// Fill cells
		while( day <= days_in_month_num ) {

			if( dayOfTheWeek > 7) { rows_html += '</tr><tr>'; dayOfTheWeek = 1; }

			var dateFormated = paddNum(day,2) +'-'+ paddNum(forMonth,2) +'-'+ paddNum(forYear,4);
			rows_html += '<td><a class="'+ this.options.calendar_class +'_cell '+cellClassPrefix+dateFormated+'" data-date="'+ dateFormated +'">' + day + '</a></td>';

			dayOfTheWeek++;
			day++;
		}

		// Fill empty cells at end
		var i = 1;
		while ( dayOfTheWeek < 8 ){
			rows_html += '<td><span class="'+ this.options.calendar_class +'_disabled">'+ i++ +'</span></td>';
			dayOfTheWeek++;
		}

		rows_html += '</tr>';

		// Return calendar html

		var cal_html =
			'<div class="meta">' +
				'<p class="meta_title"><span>'+this.options.months[forMonth-1] + ' ' + forYear +'</span></p>'+
				'<a data-to-month="'+ prevMonthNum +'" data-to-year="'+prevMonthYearNum+'" data-current-month="'+ forMonth +'" data-current-year="'+ forYear +'" class="'+ this.options.month_change_class + ' ' + this.options.prev_month_class +'"><span>'+ this.options.prev_month_text +'</span></a>' +
				'<a data-to-month="'+ nextMonthNum +'" data-to-year="'+nextMonthYearNum+'" data-current-month="'+ forMonth +'" data-current-year="'+ forYear +'" class="'+ this.options.month_change_class + ' ' + this.options.next_month_class +'"><span>'+ this.options.next_month_text +'</span></a>' +
			'</div>' +
			'<table>' +
				'<thead>' +
					'<th>'+ this.options.days[0] +'</th>' +
					'<th>'+ this.options.days[1] +'</th>' +
					'<th>'+ this.options.days[2] +'</th>' +
					'<th>'+ this.options.days[3] +'</th>' +
					'<th>'+ this.options.days[4] +'</th>' +
					'<th>'+ this.options.days[5] +'</th>' +
					'<th>'+ this.options.days[6] +'</th>' +
				'</thead>' +
				'<tbody>' +
					rows_html +
				'</tbody>' +
			'</table>';

		return cal_html;

	}, function(a,b){ return a+':'+b; });

	Simplecal.prototype = {

		init: function(){

			this.$el = $('<div class="'+ this.options.calendar_class +'" />');

			if ( this.$input.data('class') ) { this.$el.addClass( this.$input.data('class') ); }

			this.opened = false;
			this.event_namespace = '.simplecal' + (++instanceCounter);
			this.input_val_backup = this.$input.val();

			if ( this.options.attached ) { this.show_calendar(); this.$el.addClass('attached'); }
			if ( this.options.mobile_breakpoint && $window.outerWidth() <= this.options.mobile_breakpoint ) { this.set_readonly( true ); }

			this.events();

		},

		events: function(){

			var self = this;

			// input events
			this.$input
				.on('focus click', function(e){ self.on_focus(e); })
				.on('change', function(e){ self.setupMarkers(e); })
				.on('keyup', function(e){ self.on_keyup(e); });

			// Choose date
			this.$el.on('click', '.' + this.options.calendar_class +'_cell', function(e){ self.on_select_date(e, this); });

			// Change month
			this.$el.on('click', '.' + this.options.month_change_class, function(e){ self.on_change_month(e, $(this)); return false; });

			// Custom events
			this.$el.on('show', function(){ self.on_show(); });
			this.$el.on('close', function(){ self.on_close(); });

		},

		// event handlers

		on_focus: function(){

			if ( this.validate_input() ) { this.show_calendar(); }

		},

		on_keyup: function(e){

			if( $.inArray(e.keyCode, [37,38,39,40,16,27]) >= 0 ){ return; }

			if ( !this.validate_input() ){ return; }

			var date = this.$input.val().length === 0 ? this.getDateVars( new Date() ) : this.getDateVars( this.$input.val() );
			this.$el.html( this.generate_calendar_html( date.month, date.year ) );
			this.setupMarkers();

		},

		on_select_date: function(e, target){

			var date_val = this.formatDate( this.getDateVars( $(target).data('date'), 'dd-mm-yyyy' ) );

			this.$input.val( date_val ).trigger('change');
			if ( !this.options.attached ) { this.close(); }

		},

		on_change_month: function(e, $target){

			this.$el.html( this.generate_calendar_html( $target.data('to-month'), $target.data('to-year') ) );
			this.setupMarkers();
			if( !this.options.attached ) { this.setup_position(); }

		},

		on_show: function(){

			var self = this;
			this.$input.addClass( this.options.input_active_class );

			$window.on('resize'+this.event_namespace, function(){
				if( !self.options.attached ) { self.setup_position(); }
			});

			$document.on('click'+this.event_namespace+' focusout'+this.event_namespace+' keyup'+this.event_namespace, function(e){

				if (e.keyCode && e.keyCode === 27) { if ( self.opened ){ self.close(); return; } }

				var $target = $(e.target);
				if( !$target.is( self.$input ) && !$target.is( self.$el ) && !$target.parents().is( self.$el ) ) { self.close(); }

			});

		},

		on_close: function(){

			this.$input.removeClass( this.options.input_active_class );
			$document.off(this.event_namespace);
			$window.off(this.event_namespace);

		},

		// events end

		set_readonly: function( yep ){

			if ( yep ) { this.input.readOnly = true; }
			else { this.input.readOnly = false; }

		},

		validate_input: function(){

			var current_val = this.$input.val();

			if ( current_val.length === 0 || this.getDateVars( current_val ) ){

				this.$input.removeClass( this.options.calendar_class + '_invalid');
				this.input_val_backup = current_val;
				return true;

			} else {

				this.$input.addClass( this.options.calendar_class + '_invalid');
				this.options.disableInvalidInput && this.$input.val( this.input_val_backup );
				return false;

			}

		},

		show_calendar: function(){

			if (this.opened) { return; }

			this.opened = true;
			var date = this.$input.val().length === 0 ? this.getDateVars( new Date() ) : this.getDateVars( this.$input.val() );

			this.$el.html( this.generate_calendar_html( date.month, date.year ) );
			this.setupMarkers();

			if ( this.options.attached ) {

				if ( this.$attach_cont ) { return; }

				this.$attach_cont = typeof this.options.attached === 'string' ? this.$input.closest( this.options.attached ) : this.$input.parent();
				this.$el.appendTo( this.$attach_cont );

			} else {

				this.$el.appendTo( $body );
				this.setup_position();
				this.$el.trigger('show');

			}

		},

		close: function(){

			if ( !this.opened ) { return; }

			this.opened = false;
			this.$el.detach().trigger('close');

		},

		setupMarkers: function(){

			// cleanup
			this.$el.find('.'+ this.options.date_active_class ).removeClass( this.options.date_active_class );

			var prepareSelector = function( date){
				return '.' + cellClassPrefix + paddNum(date.day,2) + '-' + paddNum(date.month,2) + '-' + paddNum(date.year,4);
			};

			// today
			this.$el.find(prepareSelector(this.getDateVars(new Date()))).addClass( this.options.date_today_class );

			// selected date
			var inputVal = this.$input.val();
			if ( inputVal.length && this.getDateVars(inputVal)) {
				this.$el.find(prepareSelector(this.getDateVars(inputVal))).addClass( this.options.date_active_class );
			}

		},

		setup_position: function(){

			var win_height = $window.outerHeight();
			var win_width  = $window.outerWidth();

			var input_offset = this.$input.offset();
			var input_height = this.$input.outerHeight();
			var input_width  = this.$input.outerWidth();

			// Mobile
			if ( this.options.mobile_breakpoint && win_width <= this.options.mobile_breakpoint ){

				this.set_readonly( true );
				this.$el.attr('style','').addClass(this.options.calendar_class + '_mobile').css({ 'top': input_offset.top + input_height  });
				return;

			} else {

				this.$el.removeClass(this.options.calendar_class + '_mobile');
			}

			// Large screens
			var cal_width  = this.$el.outerWidth();
			var cal_height = this.$el.outerHeight();

			var position_map = {};

			// position checks
			if ( (cal_width + input_offset.left) > win_width ) { // cuts to the right

				position_map.left = input_offset.left - ( cal_width - input_width );
				position_map.top = input_offset.top + input_height;

			} else if ( cal_height + input_offset.top > win_height ){ // cuts at bottom

				position_map.left = input_offset.left;
				position_map.top = input_offset.top - cal_height;

			} else { // Normal case

				position_map = { 'left': input_offset.left, 'top': input_offset.top + input_height };

			}

			this.$el.css( position_map );

		},

		increment_date: function( num ){

			var current_date_vars = this.getDateVars( this.$input.val() );
			var current_date = new Date( current_date_vars.year, current_date_vars.month - 1, current_date_vars.day  );
			return this.set_date( new Date(current_date.getTime() + num *(24 * 60 * 60 * 1000)) );

		},

		set_date: function( date, dateFormat ){

			this.$input.val( this.formatDate( this.getDateVars( date, dateFormat ) ) ).trigger('change');
			return this;

		},

		getDateVars: Simplecal.getDateVars,
		generate_calendar_html: Simplecal.getHtml,
		formatDate: Simplecal.formatDate

	};

	$.fn.simplecal = function ( options ) {
		return this.each(function () {
			if (!$.data(this, 'simplecal')) {
				$.data(this, 'simplecal', new Simplecal( this, options ));
			}
		});
	};

	$.simplecal = Simplecal;

	$.simplecal.defaults = {

		dateFormat: 'dd.mm.yyyy',
		attached: false,
		disableWhenTouch: false,
		mobile_breakpoint: null,
		disableInvalidInput: false,

		max_date: null,
		min_date: null,

		calendar_class: 'simplecal',
		input_active_class: 'active',
		date_active_class: 'selected',
		date_today_class: 'today',
		month_change_class: 'month_control',
		next_month_class: 'next',
		prev_month_class: 'prev',

		prev_month_text: 'Previous month',
		next_month_text: 'Next month',

		months: [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ],
		days: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

	};

})(window.jQuery || window.Zepto, window, document);