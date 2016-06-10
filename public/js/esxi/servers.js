var esxi = new Esxi();

$( document ).ready(function() {
  esxi.update();
});
    
function Esxi(){
  
  //private variables
  var servers = [];
  
  this.update = function update(){
    
    $("#servers").fadeOut();
    $("#loading-servers").fadeIn();
    $.ajax({
      url: "server/list",
      success: function (json) {
        
          $("#loading-servers").hide();
          $("#servers").fadeIn();
          console.log(json);
          servers = json.servers;
          list(servers);
          
          var ids = [];
          //TODO use a map
          for (var i=0; i < servers.length; i++){
            ids.push(servers[i].id);             
          }
          status(ids.join(","));
      }
    });   
  }
  
  var status = function(ids){
    
    console.log("Requesting server "+ids +" status");
    for (var i = 0; i< ids.split(",").length;i++){
      var id = ids.split(",")[i];
      $("#"+id+"-status").removeClass().addClass("status").addClass("status-loading");
    }
    $.ajax({
      url: "server/status/"+ids,
      success: function (json) {
        
        for (var i=0; i< json.status.length; i++){
          var status = json.status[i];
          if (status.status == "poweredOn") setOn(status.id);
          else setOff(status.id);
        }
      }
    });   
  }
  
  var setOn = function(id){
    $("#"+id+"-status").removeClass("status-loading")
                              .addClass("status-ok");
    $("#"+id+"-powerOn").hide();
    $("#"+id+"-powerOff").removeAttr("disabled").show();
  }
  var setOff = function(id){
    $("#"+id+"-status").removeClass("status-loading")
                              .addClass("status-error");
                              
    $("#"+id+"-powerOn").removeAttr("disabled").show();
    $("#"+id+"-powerOff").hide();
  }
  
  var powerOn = function(id){
    console.log("Powering on server "+id);
    $.ajax({
      url: "server/power/on/"+id,
      success: function (json) {
        //reload status
        $("#"+id+"-powerOn").attr("disabled", "disabled");
        setTimeout(function(){status(id)},5000);
      }
    });   
  }
  var powerOff = function(id){
    console.log("Powering off server "+id);
    $.ajax({
      url: "server/power/off/"+id,
      success: function (json) {
        //reload status
        $("#"+id+"-powerOff").attr("disabled", "disabled");
        setTimeout(function(){status(id)},5000);
      }
    });   
  }
  //private methods
  var list = function(servers){
    
    var $table = $("#servers");
    $table.html("<tr><th>Id</th><th>Name</th><th>Disk<th></th>OS</th>"+
                    //"<th>Version</th>"+
                    //"<th>Annotation</th>"+
                    "<th>Status</th><th>Actions</th></tr>");
    for (var i=0; i< servers.length; i++){
      var server = servers[i],
          row = "<tr><td>"+server.id+"</td>"+
                    "<td>"+server.name+"</td>"+
                    "<td>"+server.file+"</td>"+
                    "<td>"+server.os+"</td>"+
                    //"<td>"+server.version+"</td>"+
                    //"<td>"+server.annotation+"</td>"+
                    "<td><img id='"+server.id+"-status' /></td>"+
                    "<td><button id='"+server.id+"-powerOn' class='secondary tiny'>Power on</button>"+
                         "<button id='"+server.id+"-powerOff' class='tiny'>Power off</button></td></tr>";
      $table.append(row);
      $("#"+server.id+"-powerOn").click(function() {
        var id = $(this).attr("id").split("-")[0];
        powerOn(id); 
      });
      $("#"+server.id+"-powerOff").click(function() {
        var id = $(this).attr("id").split("-")[0];
        powerOff(id); 
      });
      
    }
    $("button").hide();
  }
}