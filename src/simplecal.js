(function(root, factory) {

    if (typeof define === 'function' && define.amd) {
        define(['jquery', 'js/components/simplecal'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('jquery'), require('js/components/simplecal'));
    } else {
        factory(root.jQuery);
    }

}(this, function($) {

	"use strict";

	var	$window = window.app && window.app.$window || $(window),
		$document = window.app && window.app.$document || $(document),
		$body = window.app && window.app.$body || $('body'),
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

	function Simplecal(input, options) {

		this.options = $.extend({}, $.simplecal.defaults, options);
		this.$input = $(input);
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

	Simplecal.getHtml = function(forMonth, forYear) {

		forMonth = parseInt(forMonth,10);
		forYear = parseInt(forYear,10);

		var dayOfTheWeek = new Date(forYear, forMonth-1, 1).getDay();
		if ( dayOfTheWeek === 0 ) { dayOfTheWeek = 7; }

		var nextMonthDate = new Date(forYear, forMonth, 1),
			prevMonthDate = new Date(forYear, forMonth - 2, 1),
			nextMonthNum = nextMonthDate.getMonth() + 1,
			nextMonthYearNum = nextMonthDate.getFullYear(),
			prevMonthNum = prevMonthDate.getMonth() + 1,
			prevMonthYearNum = prevMonthDate.getFullYear();

		var rowsHtml = '<tr>',
			daysInMonthBefore = 0,
			daysInMonthNum = daysInMonth(forMonth, forYear),
			day = 1;

		// Fill empty cells at beginning
		if ( forMonth-1 < 1 ) {
			daysInMonthBefore = daysInMonth(12, forYear-1);
		} else {
			daysInMonthBefore = daysInMonth(forMonth-1, forYear);
		}

		for( var n=1; n<dayOfTheWeek; n++ ) {
			rowsHtml += '<td><span class="'+ this.options.cellDisabledClass +'">'+ (daysInMonthBefore - dayOfTheWeek + n + 1) +'</span></td>';
		}

		// Fill cells
		while( day <= daysInMonthNum ) {

			if( dayOfTheWeek > 7) { rowsHtml += '</tr><tr>'; dayOfTheWeek = 1; }

			var dateFormated = paddNum(day,2) +'-'+ paddNum(forMonth,2) +'-'+ paddNum(forYear,4),
				dateStandard = paddNum(forYear,4) +'-'+ paddNum(forMonth,2) +'-'+ paddNum(day,2);

			if ( new Date(this.options.allowedDates.from) > new Date(dateStandard) || new Date(this.options.allowedDates.to) < new Date(dateStandard) ) {

				rowsHtml += '<td><span class="'+ this.options.cellDisabledClass +'">'+ day +'</span></td>';

			} else {

				rowsHtml += '<td><a class="'+ this.options.cellClass +' '+cellClassPrefix+dateFormated+'" data-date="'+ dateFormated +'">' + day + '</a></td>';

			}

			dayOfTheWeek++;
			day++;
		}

		// Fill empty cells at end
		var i = 1;
		while ( dayOfTheWeek < 8 ){
			rowsHtml += '<td><span class="'+ this.options.cellDisabledClass +'">'+ i++ +'</span></td>';
			dayOfTheWeek++;
		}

		rowsHtml += '</tr>';

		// Prepare year and month heading

		var monthString = this.options.months[forMonth-1],
			yearString = forYear;

		if (this.options.changeMonth) {

			monthString = '<select class="'+ this.options.monthSelectClass +'">';

			for (i = 0; i < 12; i++) {
				monthString += '<option data-to-year="'+ forYear +'" value="'+ (i+1) +'" '+ (forMonth - 1 === i ? ' selected="selected"' : '') +'>'+ this.options.months[i] +'</option>';
			}

			monthString += '</select>';

		}

		if (this.options.changeYear) {

			yearString = '<select class="'+ this.options.yearSelectClass +'">';

			for (i = 100; i > 0; i--) {
				yearString += '<option value="'+ (forYear - i) +'">'+ (forYear - i) +'</option>';
			}

			yearString += '<option selected="selected" value="'+ forYear +'">'+ forYear +'</option>';

			for (i = 1; i < 100; i++) {
				yearString += '<option value="'+ (forYear + i) +'">'+ (forYear + i) +'</option>';
			}

			yearString += '</select>';

		}

		// Return calendar html

		var calHtml =
			'<div class="meta">' +
				'<p class="meta_title"><span class="month">'+ monthString + '</span> <span class="year">' + yearString +'</span></p>'+
				'<a data-to-month="'+ prevMonthNum +'" data-to-year="'+prevMonthYearNum+'" data-current-month="'+ forMonth +'" data-current-year="'+ forYear +'" class="'+ this.options.monthChangeClass + ' ' + this.options.prevMonthClass +'"><span>'+ this.options.prevMonthText +'</span></a>' +
				'<a data-to-month="'+ nextMonthNum +'" data-to-year="'+nextMonthYearNum+'" data-current-month="'+ forMonth +'" data-current-year="'+ forYear +'" class="'+ this.options.monthChangeClass + ' ' + this.options.nextMonthClass +'"><span>'+ this.options.nextMonthText +'</span></a>' +
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
					rowsHtml +
				'</tbody>' +
			'</table>';

		if (this.options.todayButton){
			calHtml += '<button class="'+ this.options.todayButtonClass +'">'+ this.options.todayButtonText +'</button>' ;
		}

		return calHtml;

	};


	$.extend(Simplecal.prototype,{

		init: function(){

			this.$el = $('<div>').addClass(this.options.calendarClass);
			this.$calEl = $('<div>').addClass(this.options.calendarClass + 'Inner').appendTo(this.$el);

			this.opened = false;
			this.ens = '.simplecal' + (++instanceCounter);
			this.inputDateValBackup = this.getInputDateVal();

			this.$input.data('class') && this.$el.addClass( this.$input.data('class') );
			this.$input.data('date-format') && (this.options.dateFormat = this.$input.data('date-format'));
			this.$input.data('time-step') && (this.options.timeStep = parseInt(this.$input.data('time-step'),10));

			this.$input.data('change-month') && (this.options.changeMonth = true);
			this.$input.data('change-year') && (this.options.changeYear = true);

			typeof this.$input.data('show-seconds') !== 'undefined' && (this.options.showSeconds = !!this.$input.data('show-seconds'));

			if ( this.options.attached ) { this.showCalendar(); this.$el.addClass(this.options.attachedClass); }
			if ( this.options.mobileBreakpoint && $window.outerWidth() <= this.options.mobileBreakpoint ) { this.setReadonly(true); }

			this.options.timepicker && this.setupTimePicker();

			this.events();

		},

		getInputDateVal: function(){

			var dateVal = this.$input.val();

			if (dateVal.length) {
				return this.options.timepicker ? dateVal.split(' ')[0] : dateVal;
			} else {
				return '';
			}

		},

		setInputDateVal: function(value){

			this.$input.val(this.options.timepicker?  value + ' ' + this.formatTime(parseInt(this.$inputTime.val(),10)) : value);
			return this;

		},

		getInputTimeVal: function(){

			var dateVal = this.$input.val();
			return dateVal.length !== 0 ? dateVal.split(' ')[1] : this.formatTime(0);

		},

		setInputTimeVal: function(value){

			this.$input.val(this.$input.val().split(' ')[0] + ' ' + value);
			return this;

		},

		events: function(){

			var cellSelector = '.' + this.options.cellClass.split(' ').join('.'),
				monthChangeSelector = '.' + this.options.monthChangeClass.split(' ').join('.');

			// input events
			this.$input
				.on('focus' + this.ens + ' click' + this.ens, $.proxy(this.onFocus, this))
				.on('change' + this.ens, $.proxy(this.setupMarkers, this))
				.on('keyup' + this.ens, $.proxy(this.onKeyup, this));

			// Choose date
			this.$el.on('click' + this.ens, cellSelector, $.proxy(this.onSelectDate, this));

			// Change month
			this.$el.on('click' + this.ens, monthChangeSelector, $.proxy(this.onChangeMonth, this));

			// Change month and year select
			this.options.changeMonth && this.$el.on('change' + this.ens, '.' + this.options.monthSelectClass.split(' ').join('.'), $.proxy(this.onMonthSelect, this));
			this.options.changeYear && this.$el.on('change' + this.ens, '.' + this.options.yearSelectClass.split(' ').join('.'), $.proxy(this.onYearSelect, this));

			// Today button
			this.options.todayButton && this.$el.on('click' + this.ens, '.' + this.options.todayButtonClass.split(' ').join('.'), $.proxy(this.onClickTodayButton, this));

			// Custom events
			this.$el.on('show', $.proxy(this.onShow, this));
			this.$el.on('close', $.proxy(this.onClose, this));

		},

		// event handlers

		onFocus: function(){

			if ( this.validateInput() ) { this.showCalendar(); }

		},

		onKeyup: function(e){

			if( $.inArray(e.keyCode, [37,38,39,40,16,27]) >= 0 ){ return; }

			if ( !this.validateInput() ){ return; }

			var date = this.getInputDateVal().length === 0 ? this.getDateVars( new Date() ) : this.getDateVars(this.getInputDateVal());
			this.$calEl.html(this.getCalendarHtml(date.month, date.year));
			this.setupMarkers();

		},

		onSelectDate: function(e){

			var dateVal = this.formatDate(this.getDateVars($(e.target).data('date'), 'dd-mm-yyyy'));

			this.setInputDateVal(dateVal).$input.trigger('change');
			if (!this.options.attached) { this.close(); }

		},

		onChangeMonth: function(e){

			var $target = $(e.currentTarget);
			this.$calEl.html( this.getCalendarHtml( $target.data('to-month'), $target.data('to-year') ) );
			this.setupMarkers();
			if( !this.options.attached ) { this.setupPosition(); }

			return false;

		},

		onMonthSelect: function(e){

			var $select = $(e.currentTarget),
				$option = $select.find(":selected");

			this.$calEl.html(this.getCalendarHtml($option.val(), $option.data('to-year')));
			this.setupMarkers();

			if( !this.options.attached ) { this.setupPosition(); }

			return false;

		},

		onYearSelect: function(e){

			var $select = $(e.currentTarget),
				$option = $select.find(":selected");

			this.$calEl.html(this.getCalendarHtml(1 ,$option.val()));
			this.setupMarkers();

			if( !this.options.attached ) { this.setupPosition(); }

			return false;

		},

		onClickTodayButton: function(e){

			e.preventDefault();
			this.setDate(new Date(), this.options.format);

		},

		onShow: function(){

			var self = this;
			this.$input.addClass( this.options.inputActiveClass );

			if( !self.options.attached ) {

				$window.on('resize'+this.ens, function(){
					self.setupPosition();
				});

				setTimeout(function(){
					$document.on('click'+self.ens+' focusout'+self.ens+' keyup'+self.ens, function(e){

						if (e.keyCode === 27 && self.opened ) {
							self.close();
							return;
						}

						!$(e.target).is( self.$input ) && !$.contains(self.$el[0], e.target) && self.close();

					});
				}, 0);

			}

		},

		onClose: function(){

			this.$input.removeClass( this.options.inputActiveClass );
			$document.off(this.ens);
			$window.off(this.ens);

		},

		// events end

		setReadonly: function( readOnly ){

			this.$input[0].readOnly = readOnly;

		},

		validateInput: function(){

			var currentVal = this.getInputDateVal();

			if ( currentVal.length === 0 || this.getDateVars( currentVal ) ){

				this.$input.removeClass(this.options.calendarClass + '_invalid');
				this.inputDateValBackup = currentVal;
				return true;

			} else {

				this.$input.addClass(this.options.calendarClass + '_invalid');
				this.options.disableInvalidInput && this.setInputDateVal(this.inputDateValBackup);
				return false;

			}

		},

		showCalendar: function(){

			if (this.opened) { return; }

			this.opened = true;
			var date = this.getInputDateVal().length === 0 ? this.getDateVars(new Date()) : this.getDateVars(this.getInputDateVal());

			this.$calEl.html(this.getCalendarHtml( date.month, date.year ));
			this.setupMarkers();

			if ( this.options.attached ) {

				if ( !this.$attachCont ) {

					this.$attachCont = typeof this.options.attached === 'string' ? this.$input.closest( this.options.attached ) : this.$input.parent();
					this.$el.appendTo( this.$attachCont );

				}

			} else {

				this.$el.appendTo( $body );
				this.setupPosition();
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
			this.$el.find('.'+ this.options.dateActiveClass ).removeClass( this.options.dateActiveClass );

			var prepareSelector = function(date){
				return '.' + cellClassPrefix + paddNum(date.day,2) + '-' + paddNum(date.month,2) + '-' + paddNum(date.year,4);
			};

			// today
			this.$el.find(prepareSelector(this.getDateVars(new Date()))).addClass( this.options.dateTodayClass );

			// selected date
			if ( this.getInputDateVal().length ) {
				this.$el.find(prepareSelector(this.getDateVars(this.getInputDateVal()))).addClass(this.options.dateActiveClass);
			}

		},

		setupPosition: function(){

			var winHeight = $window.outerHeight(),
				winWidth  = $window.outerWidth(),

				inputOffset = this.$input.offset(),
				inputHeight = this.$input.outerHeight(),
				inputWidth  = this.$input.outerWidth();

			// Mobile
			if ( this.options.mobileBreakpoint && winWidth <= this.options.mobileBreakpoint ){

				this.setReadonly( true );
				this.$el.attr('style','').addClass(this.options.calendarMobileClass).css({ 'top': inputOffset.top + inputHeight  });
				return;

			} else {

				this.$el.removeClass(this.options.calendarClass + '_mobile');

			}

			// Large screens
			var calWidth  = this.$el.outerWidth(),
				calHeight = this.$el.outerHeight(),
				positionMap = {};

			// position checks
			if ( (calWidth + inputOffset.left) > winWidth ) { // cuts to the right

				positionMap.left = inputOffset.left - ( calWidth - inputWidth );
				positionMap.top = inputOffset.top + inputHeight;

			} else if ( calHeight + inputOffset.top + inputHeight > winHeight + $window.scrollTop() ){ // cuts at bottom

				positionMap.left = inputOffset.left;
				positionMap.top = inputOffset.top - calHeight;

			} else { // Normal case

				positionMap = { 'left': inputOffset.left, 'top': inputOffset.top + inputHeight };

			}

			this.$el.css( positionMap );

		},

		incrementDate: function(num){

			var current_date_vars = this.getDateVars( this.getInputDateVal() );
			var current_date = new Date( current_date_vars.year, current_date_vars.month - 1, current_date_vars.day  );
			return this.setDate( new Date(current_date.getTime() + num *(24 * 60 * 60 * 1000)) );

		},

		setDate: function(date, dateFormat){

			this.setInputDateVal(this.formatDate( this.getDateVars( date, dateFormat ) ) ).$input.trigger('change');
			return this;

		},

		setupTimePicker: function(){

			this.$timeEl = $('<div>').addClass(this.options.timeElClass).appendTo(this.$el);
			this.$timePreview = $('<div>').addClass(this.options.timePreviewClass).appendTo(this.$timeEl);

			var initVal = this.getInputTimeVal(),
				time = initVal.length ? this.parseTime(initVal) : 0;

			this.$inputTime = $('<input>').val(time).appendTo(this.$timeEl).simpleRangeSlider($.extend({

				'maxVal': 24*60*60-1,
				'step': this.options.timeStep,
				'onUpdateView': $.proxy(function(value){

					var timeText = this.formatTime(parseInt(value,10));
					this.$timePreview.text(timeText);
					if (this.$input.val().length !== 0) { this.setInputTimeVal(timeText); }

				}, this)

			}, this.options.rangeSliderOptions)).on('change', $.proxy(function(){

				this.$input.trigger('change');

			}, this));

			this.rangeSliderApi = this.$inputTime.data('simpleRangeSlider');

		},

		formatTime: function(time){

			var hours = Math.floor(time/(60*60)),
				minutes = Math.floor((time - hours*60*60)/60),
				seconds = time - hours*60*60 - minutes*60;

			return paddNum(hours,2) + ':' + paddNum(minutes,2) + (this.options.showSeconds ?  ':' + paddNum(seconds,2) : '');

		},

		parseTime: function(timeString){

			var time = 0;

			$.each(timeString.split(':'), function(index, num){
				time += Math.pow(60, 2-index)*num;
			});

			return time;

		},

		destroy: function(){

			this.$input.off(this.ens).removeClass(this.options.inputActiveClass);
			$window.off(this.ens);
			$document.off(this.ens);
			this.rangeSliderApi && this.rangeSliderApi.destroy();

			this.$el.empty().remove();
			delete this.$el.data().simplecal;

		},

		getDateVars: Simplecal.getDateVars,
		getCalendarHtml: Simplecal.getHtml,
		formatDate: Simplecal.formatDate

	});

	$.fn.simplecal = function ( options ) {
		return this.each(function () {
			if (!$.data(this, 'simplecal')) {
				$.data(this, 'simplecal', new Simplecal( this, options ));
			}
		});
	};

	$.Simplecal = Simplecal;

	$.Simplecal.defaults = {

		dateFormat: 'dd.mm.yyyy',
		attached: false,
		mobileBreakpoint: null,
		disableInvalidInput: false,

		calendarClass: 'simplecal',
		calendarMobileClass: 'simplecal_mobile',
		cellClass: 'simplecal_cell',
		cellDisabledClass: 'simplecal_disabled',
		inputActiveClass: 'active',
		attachedClass: 'attached',
		dateActiveClass: 'selected',
		dateTodayClass: 'today',
		monthChangeClass: 'month_control',
		nextMonthClass: 'next',
		prevMonthClass: 'prev',
		monthSelectClass: 'sc_month_select',
		yearSelectClass: 'sc_year_select',

		changeMonth: false,
		changeYear: false,

		todayButton: false,
		todayButtonClass: 'todayBtn',
		todayButtonText: 'Today',

		allowedDates: false,

		timepicker: false,
		timeElClass: 'simplecal_time',
		timePreviewClass: 'simplecal_time_preview',
		timeStep: 60*5,
		showSeconds: true,
		rangeSliderOptions: {},

		prevMonthText: 'Previous month',
		nextMonthText: 'Next month',

		months: [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ],
		days: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

	};

	return $;

}));
