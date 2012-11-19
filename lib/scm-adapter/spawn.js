var

child_process = require('child_process'),
tracer = require('tracer').colorConsole(),
spawn = child_process.spawn;


module.exports = function(op, args, options, callback){
    args || (args = []);
    options || (options = {});

    var
        
    datas = [],
    operation = spawn(op, args, options);
    
    operation.stdout.on('data', function(data){
        data.toString().split(/\n|\r\n/).filter(function(line){
            return !!line.trim();
            
        }).forEach(function(line){
            datas.push(line.trim().split(/\t/));
        });
    });
    
    operation.stdout.on('end', function(){
        callback(datas);
    });
    
    operation.stderr.on('data', function(data){
        tracer.error('Execute command: "' + op + ' ' + args.join(' ') + '" failed. Error message:', data.toString());
        // throw 'error';
    });
    
    operation.on('exit', function(code){
        if(code){
            console.log(op, args, "process exited with code:", code);
        }
    }); 
};

