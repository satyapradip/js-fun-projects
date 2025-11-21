var elem = document.querySelectorAll('.elem');

elem.forEach(function(val){
    var img = val.querySelector('img');
    val.addEventListener('mouseenter', function(){
        img.style.opacity = 1;
    });

    val.addEventListener('mouseleave', function(){
        img.style.opacity = 0;
    });

    val.addEventListener('mousemove', function(dts){
        // var bounds = val.getBoundingClientRect();
        // img.style.left = (dets.clientX - bounds.left) + 'px';
        // img.style.top = (dets.clientY - bounds.top) + 'px';
        img.style.left = dts.pageX + 'px';
        cursor.style.top = dts.pageY + 'px';
    });
});