<?php
    header('Content-Type: application/json')
    header('Access-Control-Allow-Origin: *');

   $json = $_POST['json'];

   /* sanity check */
   if (json_decode($json) != null)
   {
     $file = fopen('general.json','w+');
     //fwrite($file, $json);
     fclose($file);
   }
   else
   {
     // user has posted invalid JSON, handle the error 
   }
?>