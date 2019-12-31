var i = 0;
$('#submit').on('click', function (e) {
    let name = $("#canzone").val();
    let artist = $("#artista").val();
    console.log(name,artist);
    
    $.post(`api/addSong/${name}|${artist}`, function (data) {
        if(data){

        }
        
    })
    

})

$('#go').on('click', function (e) {
    i++;
    console.log(i);
    
    if(i>5){
        window.location.href = "https://192.168.1.3:8080/result.html";
    }
    

})