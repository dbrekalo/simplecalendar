;(function ( $, window, document ) {

	"use strict";

	var	$window = $(window),
		$document = $(document),
		$body = null,
		is_touch_device = !!('ontouchstart' in window) || !!('onmsgesturechange' in window),
		instance_num = 0,
		calendar_html_cache = {},

		format_RE = /,|\.|-| |\/|\\/,
		day_RE = /d/gi,
		month_RE = /m/gi,
		year_RE = /y/gi,

	log = function( stuff ){
		console.log( stuff );
	},

	pad_num = function( num, padsize ){

		if ( num.toString().length > padsize ) { return num; }
		else { return new Array( padsize - num.toString().length + 1 ).join('0') + num; }

	},

	days_in_month = function( month, year ){

		return new Date(year, month, 0).getDate();

	},

	is_valid_date = function(date) {

		var d = new Date(date.year, date.month - 1, date.day);
		return d && (d.getMonth() + 1) == date.month && d.getDate() == Number(date.day);

	};

	function Simplecal( element, options ) {

		this.options = $.extend( {}, $.Simplecal.options, options);
		this.element = element;
		this.$input  = $(element);

		if ( this.options.disable_for_touch_devices && this.is_touch_device && this.$input.attr('type') == 'date' ) { return; }
		if ( !$body ) { $body = $('body'); }

		this.init();

	}

	// Utility methods

	Simplecal.get_date_vars = function( date, date_format ){

		if ( date instanceof Date ){ return { day: date.getDate(), month: date.getMonth() + 1, year: date.getFullYear() }; }
		if ( !date_format ) { date_format = this.options.date_format; }

		var format_splitter = date_format.match( format_RE )[0];

		// Get vars according to date format
		var vars = {};
		var date_arr = date.split( format_splitter );
		var format_arr = date_format.split( format_splitter );

		if ( date_arr.length !== 3 || format_arr.length !== 3 ) { log('Simplecal: Error parsing date format'); return false; }

		for ( var i = 0; i<3; i++ ){

			if ( format_arr[i].match( day_RE ) ) { vars.day = date_arr[i]; continue; }
			if ( format_arr[i].match( month_RE ) ) { vars.month = date_arr[i]; continue; }
			if ( format_arr[i].match( year_RE ) ) { vars.year = date_arr[i]; }

		}

		if ( !is_valid_date( vars ) ) { log('Simplecal: Error date out of range'); return false; }

		return vars;

	};

	Simplecal.format_date = function( date, date_format ){

		if ( date instanceof Date ){ date = { day: date.getDate(), month: date.getMonth() + 1, year: date.getFullYear() }; }
		if ( !date_format ) { date_format = this.options.date_format; }

		var date_string = date_format;

		date_string = date_string.replace(/d+/i, pad_num( date.day, date_string.match( day_RE ).length ) );
		date_string = date_string.replace(/m+/i, pad_num( date.month, date_string.match( month_RE ).length ) );
		date_string = date_string.replace(/y+/i, pad_num( date.year, date_string.match( year_RE ).length ) );

		return date_string;

	};

	Simplecal.get_html = function( for_month, for_year ){

		if ( !this.id_prefix ) { this.id_prefix = this.options.id_start + (++instance_num) + '_'; }
		if ( calendar_html_cache[for_month + '-' + for_year + '-' + this.id_prefix] ) { return calendar_html_cache[for_month + '-' + for_year + '-' + this.id_prefix]; }

		var day_of_the_week = new Date(for_year, for_month-1, 1).getDay();
		if ( day_of_the_week === 0 ) { day_of_the_week = 7; }

		var next_month_date = new Date(for_year, for_month, 1),
			prev_month_date = new Date(for_year, for_month - 2, 1),
			next_month_num = next_month_date.getMonth() + 1,
			next_month_year_num = next_month_date.getFullYear(),
			prev_month_num = prev_month_date.getMonth() + 1,
			prev_month_year_num = prev_month_date.getFullYear();

		var rows_html = '<tr>',
			days_in_month_before = 0,
			days_in_month_num = days_in_month(for_month, for_year),
			day = 1;

		// Fill empty cells at beginning
		if ( for_month-1 < 1 ) {
			days_in_month_before = days_in_month(12, for_year-1);
		} else {
			days_in_month_before = days_in_month(for_month-1, for_year);
		}

		for( var n=1; n<day_of_the_week; n++ ) {
			rows_html += '<td><span class="'+ this.options.calendar_class +'_disabled">'+ (days_in_month_before - day_of_the_week + n + 1) +'</span></td>';
		}

		// Fill cells
		while( day <= days_in_month_num ) {

			if( day_of_the_week > 7) { rows_html += '</tr><tr>'; day_of_the_week = 1; }

			var date_formated = pad_num(day,2) +'-'+ pad_num(for_month,2) +'-'+ pad_num(for_year,4);
			rows_html += '<td><a class="'+ this.options.calendar_class +'_cell" data-date="'+ date_formated +'" id="'+ this.id_prefix + date_formated +'">' + day + '</a></td>';

			day_of_the_week++;
			day++;
		}

		// Fill empty cells at end
		var i = 1;
		while ( day_of_the_week < 8 ){
			rows_html += '<td><span class="'+ this.options.calendar_class +'_disabled">'+ i++ +'</span></td>';
			day_of_the_week++;
		}

		rows_html += '</tr>';

		// Return calendar html

		var cal_html =
			'<div class="meta">' +
				'<p class="meta_title"><span>'+this.options.months[for_month-1] + ' ' + for_year +'</span></p>'+
				'<a data-to-month="'+ prev_month_num +'" data-to-year="'+prev_month_year_num+'" data-current-month="'+ for_month +'" data-current-year="'+ for_year +'" class="'+ this.options.month_change_class + ' ' + this.options.prev_month_class +'"><span>'+ this.options.prev_month_text +'</span></a>' +
				'<a data-to-month="'+ next_month_num +'" data-to-year="'+next_month_year_num+'" data-current-month="'+ for_month +'" data-current-year="'+ for_year +'" class="'+ this.options.month_change_class + ' ' + this.options.next_month_class +'"><span>'+ this.options.next_month_text +'</span></a>' +
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

		calendar_html_cache[for_month + '-' + for_year + '-' + this.id_prefix] = cal_html;
		return cal_html;

	};

	Simplecal.prototype = {

		init: function(){

			this.$el = $('<div class="'+ this.options.calendar_class +'" />');

			if ( this.$input.data('class') ) { this.$el.addClass( this.$input.data('class') ); }

			this.opened = false;
			this.id_prefix = this.options.id_start + (++instance_num) + '_';
			this.event_namespace = '.simplecal' + this.id_prefix;
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
				.on('change', function(e){ self.setup_markers(e); })
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

			var date = this.$input.val().length === 0 ? this.get_date_vars( new Date() ) : this.get_date_vars( this.$input.val() );
			this.$el.html( this.generate_calendar_html( date.month, date.year ) );
			this.setup_markers();

		},

		on_select_date: function(e, target){

			var date_val = this.format_date( this.get_date_vars( target.id.slice( this.id_prefix.length ), 'dd-mm-yyyy' ) );

			this.$input.val( date_val ).trigger('change');
			if ( !this.options.attached ) { this.close(); }

		},

		on_change_month: function(e, $target){

			this.$el.html( this.generate_calendar_html( $target.data('to-month'), $target.data('to-year') ) );
			this.setup_markers();
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

			if ( yep ) { this.element.readOnly = true; }
			else { this.element.readOnly = false; }

		},

		validate_input: function(){

			var current_val = this.$input.val();

			if ( current_val.length === 0 || this.get_date_vars( current_val ) ){

				this.$input.removeClass( this.options.calendar_class + '_invalid');
				this.input_val_backup = current_val;
				return true;

			} else {

				this.$input.addClass( this.options.calendar_class + '_invalid');
				this.$input.val( this.input_val_backup );
				return false;

			}

		},

		show_calendar: function(){

			if (this.opened) { return; }

			this.opened = true;
			var date = this.$input.val().length === 0 ? this.get_date_vars( new Date() ) : this.get_date_vars( this.$input.val() );

			this.$el.html( this.generate_calendar_html( date.month, date.year ) );
			this.setup_markers();

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

		setup_markers: function(){

			// cleanup
			this.$el.find('.'+ this.options.date_active_class ).removeClass( this.options.date_active_class );

			// today
			var today = this.get_date_vars( new Date() );
			this.$el.find( '#' + this.id_prefix + pad_num(today.day,2) + '-' + pad_num(today.month,2) + '-' + pad_num(today.year,2) ).addClass( this.options.date_today_class );

			// selected date
			if ( this.$input.val().length ) {
				var selected_date = this.get_date_vars( this.$input.val() );
				this.$el.find( '#' + this.id_prefix + selected_date.day + '-' + selected_date.month + '-' + selected_date.year  ).addClass( this.options.date_active_class );
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

			var current_date_vars = this.get_date_vars( this.$input.val() );
			var current_date = new Date( current_date_vars.year, current_date_vars.month - 1, current_date_vars.day  );
			return this.set_date( new Date(current_date.getTime() + num *(24 * 60 * 60 * 1000)) );

		},

		set_date: function( date, date_format ){

			this.$input.val( this.format_date( this.get_date_vars( date, date_format ) ) ).trigger('change');
			return this;

		},

		date_valid: function( date ){

			// to do

		},

		get_date_vars: Simplecal.get_date_vars,
		generate_calendar_html: Simplecal.get_html,
		format_date: Simplecal.format_date

	};

	$.fn.simplecal = function ( options ) {
		return this.each(function () {
			if (!$.data(this, 'simplecal')) {
				$.data(this, 'simplecal', new Simplecal( this, options ));
			}
		});
	};

	$.Simplecal = Simplecal;

	$.Simplecal.options = {

		date_format: 'dd.mm.yyyy',
		attached: false,
		disable_for_touch_devices: false,
		mobile_breakpoint: null,

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
		id_start: 'sc_',

		months: [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ],
		days: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

	};

})( jQuery, window, document );