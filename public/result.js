$.post(`api/showResult`, function (data) {
    console.log(data);
    for(canzone in data){
        $(".container").append(`
        <div class="row">
                <div class="col">${data[canzone].nomeCanzone}</div>
                <div class="col">${data[canzone].artistaCanzone}</div>
            </div>
            <hr>
        `);
    }
})
var i=0;
$('#go').on('click', function (e) {
    i++;
    console.log(i);
    
    if(i>5){
        window.location.href = "http://localhost:8080";
    }
    

})