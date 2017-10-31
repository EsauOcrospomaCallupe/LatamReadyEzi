/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope Public
 */

define(["N/record", "N/runtime", "N/file", "N/email", "N/encode", "N/search", "N/format", "N/log", "N/config", "N/task"],
    function(record, runtime, file, EMAIL, encode, search, format, log, config, task) {

    

    function execute(context)
    {
        try{

            log.error("INICIO", "INICIO");

            /* Obtiene empleado receptor email */
           var user_emp = runtime.getCurrentUser();

            var recEmp = search.lookupFields({
                type   : search.Type.EMPLOYEE,
                id     : user_emp,
                columns: ['firstname', 'email'] 
            });
            var nameUser  = recEmp.firstname;
            var emailUser = recEmp.email;


            EMAIL.send({
                author: user_emp,
                recipients: emailUser,
                subject: "Prueba PE XML BM",
                body: "Body pes"
                
            });

            

            log.error("FIN", "FIN");

        }catch(e){
            log.error("Catch", e.valueOf().toString());
        }

    }



    return {
        execute: execute
    };

});