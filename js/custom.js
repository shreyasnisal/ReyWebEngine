
const sections = ['landing', 'projects', 'about']

// Menu-Toggler animations
$('.menu-toggler').on('click', function() {
    $('.top-nav').addClass('open')
    $('.top-nav').removeClass('not-open')
});

$('.menu-toggler-close-button').on('click', function() {
    $('.top-nav').removeClass('open')
    $('top-nav').addClass('not-open')
})

$('.top-nav .nav-link').on('click', function() {
    $('.top-nav').removeClass('open')
    $('.top-nav').addClass('not-open')
});
