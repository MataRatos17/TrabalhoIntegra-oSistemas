	(function ($) {
	
	"use strict";

	// Page loading animation
	$(window).on('load', function() {

        $('#js-preloader').addClass('loaded');

    });

	// WOW JS
	$(window).on ('load', function (){
		if (window.WOW && $(".wow").length) { 
			var wow = new WOW ({
                boxClass:     'wow',      // Animated element css class (default is wow)
                animateClass: 'animated', // Animation css class (default is animated)
                offset:       20,         // Distance to the element when triggering the animation (default is 0)
                mobile:       true,       // Trigger animations on mobile devices (default is true)
                live:         true,       // Act on asynchronously loaded content (default is true)
            });
            wow.init();
        }
    });

	$(window).scroll(function() {
	var scroll = $(window).scrollTop();
	var box = $('.header-text').height();
	var header = $('header').height();

	if (scroll >= box - header) {
	    $("header").addClass("background-header");
	} else {
	    $("header").removeClass("background-header");
	}
	});
	
	$('.filters ul li').click(function(){
        $('.filters ul li').removeClass('active');
        $(this).addClass('active');
        
        var data = $(this).attr('data-filter');
        $grid.isotope({
            filter: data
        })
        });

		var $grid = $(".grid").isotope({
			itemSelector: ".all",
			percentPosition: true,
			masonry: {
				columnWidth: ".all"
			}
		});

	var width = $(window).width();
		$(window).resize(function() {
			if (width > 992 && $(window).width() < 992) {
				location.reload();
			}
			else if (width < 992 && $(window).width() > 992) {
				location.reload();
			}
	})



	$(document).on("click", ".naccs .menu div", function() {
		var numberIndex = $(this).index();
	
		if (!$(this).is("active")) {
			$(".naccs .menu div").removeClass("active");
			$(".naccs ul li").removeClass("active");
	
			$(this).addClass("active");
			$(".naccs ul").find("li:eq(" + numberIndex + ")").addClass("active");
	
			var listItemHeight = $(".naccs ul")
				.find("li:eq(" + numberIndex + ")")
				.innerHeight();
			$(".naccs ul").height(listItemHeight + "px");
		}
	});

	$('.owl-features').owlCarousel({
		items:3,
		loop:true,
		dots: false,
		nav: true,
		autoplay: true,
		margin:30,
		responsive:{
			0:{
				items:1
			},
			600:{
				items:2
			},
			1200:{
				items:3
			},
			1800:{
				items:3
			}
		}
	})

	$('.owl-collection').owlCarousel({
		items:3,
		loop:true,
		dots: false,
		nav: true,
		autoplay: true,
		margin:30,
		responsive:{
			0:{
				items:1
			},
			800:{
				items:2
			},
			1000:{
				items:3
			}
		}
	})

	$('.owl-banner').owlCarousel({
		items:1,
		loop:true,
		dots: false,
		nav: true,
		autoplay: true,
		margin:30,
		responsive:{
			0:{
				items:1
			},
			600:{
				items:1
			},
			1000:{
				items:1
			}
		}
	})

	
	
	

	// Menu Dropdown Toggle
	if($('.menu-trigger').length){
		$(".menu-trigger").on('click', function() {	
			$(this).toggleClass('active');
			$('.header-area .nav').slideToggle(200);
		});
	}


	// Menu elevator animation
	$('.scroll-to-section a[href*=\\#]:not([href=\\#])').on('click', function() {
		if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') && location.hostname == this.hostname) {
			var target = $(this.hash);
			target = target.length ? target : $('[name=' + this.hash.slice(1) +']');
			if (target.length) {
				var width = $(window).width();
				if(width < 991) {
					$('.menu-trigger').removeClass('active');
					$('.header-area .nav').slideUp(200);	
				}				
				$('html,body').animate({
					scrollTop: (target.offset().top) - 80
				}, 700);
				return false;
			}
		}
	});

	$(document).ready(function () {
	    $(document).on("scroll", onScroll);
	    
	    //smoothscroll
	    $('.scroll-to-section a[href^="#"]').on('click', function (e) {
	        e.preventDefault();
	        $(document).off("scroll");
	        
	        $('.scroll-to-section a').each(function () {
	            $(this).removeClass('active');
	        })
	        $(this).addClass('active');
	    
			var targetHash = this.hash,
				menu = targetHash;
			var target = $(targetHash);
	        $('html, body').stop().animate({
	            scrollTop: (target.offset().top) - 79
	        }, 500, 'swing', function () {
				window.location.hash = targetHash;
	            $(document).on("scroll", onScroll);
	        });
	    });
	});

	function onScroll(event){
	    var scrollPos = $(document).scrollTop();
	    $('.nav a').each(function () {
	        var currLink = $(this);
	        var ref = currLink.attr("href");
	        var refElement = ref && ref.startsWith('#') ? $(ref) : $();
	        if (refElement.length && refElement.position().top <= scrollPos && refElement.position().top + refElement.height() > scrollPos) {
	            $('.nav ul li a').removeClass("active");
	            currLink.addClass("active");
	        }
	        else{
	            currLink.removeClass("active");
	        }
	    });
	}


	// Page loading animation
	$(window).on('load', function() {
		if($.fn.parallax && $('.cover').length){
			$('.cover').parallax({
				imageSrc: $('.cover').data('image'),
				zIndex: '1'
			});
		}

		$("#preloader").animate({
			'opacity': '0'
		}, 600, function(){
			setTimeout(function(){
				$("#preloader").css("visibility", "hidden").fadeOut();
			}, 300);
		});
	});

	// Global handler for search input Enter key
	window.handle = function(e) {
		var key = e && (e.key || e.keyCode);
		var isEnter = key === 'Enter' || key === 13;
		if (isEnter) {
			if (e && e.preventDefault) { e.preventDefault(); } else { e.returnValue = false; }
			var input = document.getElementById('searchText');
			var q = input && input.value ? input.value.trim() : '';
			if (q) {
				window.location.href = 'browse.html?q=' + encodeURIComponent(q);
			}
		}
	};

	

	const dropdownOpener = $('.main-nav ul.nav .has-sub > a');

    // Open/Close Submenus
    if (dropdownOpener.length) {
        dropdownOpener.each(function () {
            var _this = $(this);

            _this.on('tap click', function (e) {
                var thisItemParent = _this.parent('li'),
                    thisItemParentSiblingsWithDrop = thisItemParent.siblings('.has-sub');

                if (thisItemParent.hasClass('has-sub')) {
                    var submenu = thisItemParent.find('> ul.sub-menu');

                    if (submenu.is(':visible')) {
                        submenu.slideUp(450, 'easeInOutQuad');
                        thisItemParent.removeClass('is-open-sub');
                    } else {
                        thisItemParent.addClass('is-open-sub');

                        if (thisItemParentSiblingsWithDrop.length === 0) {
                            thisItemParent.find('.sub-menu').slideUp(400, 'easeInOutQuad', function () {
                                submenu.slideDown(250, 'easeInOutQuad');
                            });
                        } else {
                            thisItemParent.siblings().removeClass('is-open-sub').find('.sub-menu').slideUp(250, 'easeInOutQuad', function () {
                                submenu.slideDown(250, 'easeInOutQuad');
                            });
                        }
                    }
                }

                e.preventDefault();
            });
        });
    }


	


})(window.jQuery);

// API helper centralizado em /met (fora do bloco principal)
(function(){
	var BASE = 'http://localhost:3001/met';
	function buildUrl(path, params){
		var url = BASE + (path && path.charAt(0) !== '/' ? '/' + path : (path || ''));
		if (params && typeof params === 'object'){
			var sp = new URLSearchParams();
			Object.keys(params).forEach(function(k){
				if (params[k] !== undefined && params[k] !== null) sp.append(k, params[k]);
			});
			var qs = sp.toString();
			if (qs) url += (url.indexOf('?') === -1 ? '?' : '&') + qs;
		}
		return url;
	}
	window.api = {
		baseUrl: BASE,
		fetchJson: function(path, params){
			var url = buildUrl(path, params);
			return fetch(url, { headers: { 'Accept': 'application/json' } })
				.then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); });
		},
		games: function(params){ return this.fetchJson('games', params); },
		streams: function(params){ return this.fetchJson('streams', params); },
		all: function(){ return this.fetchJson('data'); },
		health: function(){ return this.fetchJson('health'); }
	};
	if (typeof window.fetch === 'function'){
		window.api.health().then(function(h){
			console.log('[API /met] health:', h);
		}).catch(function(err){
			console.warn('[API /met] indisponível. Inicie o servidor da API.', err);
		});
	}
})();