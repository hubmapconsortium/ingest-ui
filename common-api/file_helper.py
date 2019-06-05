#utilities for file and os access

import subprocess
import os
import shutil
import string_helper
import logging

#checks the fpath parameter to see if the file exists and
#is executable.  Returns True or False.
def is_exe(fpath):
    return os.path.isfile(fpath) and os.access(fpath, os.X_OK)

#checks to see if an executable exists in the currently 
#configured path
def executableExists(prgmName):
    fpath, fname = os.path.split(prgmName)
    if fpath:
        if is_exe(prgmName):
            return True
    else:
        for path in os.environ["PATH"].split(os.pathsep):
            exe_file = os.path.join(path, fname)
            if is_exe(exe_file):
                return True

    return False

#shell call to execute a program
#procArry- is a list of arguments to execute,
#with the first element being the name of the
#executable
#
#inputFile- an optional file to take input from
#
def callExecutable(procArry, inputFile = None):    
    try:
        #get the logger
        logger = logging.getLogger('move-wp')

        #print the command to the log file
        cmd = ""
        for arg in procArry:
            cmd = cmd + arg + " "
        logger.info(cmd)

        #if there is no input file execute without it
        #if there is an input file send it into the process
        #redirect stdout and stderr to the subprocess
        #which will be intercepted (by process.poll)
        #via the inline check_io
        if inputFile is None:
            process = subprocess.Popen(procArry, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        else:
            inpt = open(inputFile)
            process = subprocess.Popen(procArry, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, stdin=inpt)

        #method to output stdout and stderr to the log file
        def check_io():
            while True:
                output = process.stdout.readline().decode()
                if output:
                    if not string_helper.isBlank(output):
                        logger.log(logging.INFO, output.rstrip())
                else:
                    break
        
        #loop while the proccess is active to record output in log file
        while process.poll() is None:
            check_io()
        
        #return True if the process returns a zero code
        #False, otherwise
        if process.returncode != 0:
            return False
        else:
            return True
    
    #catch any excptions, record the error to the log file and return a False
    except Exception as e:
        logger.error("Error while executing " + str(procArry)[1:-1] + "\n" + str(e))
        logger.error(e, exc_info=True)
        return False 

def log_subprocess_output(pipe):
    for line in iter(pipe.readline, b''): # b'\n'-separated lines
        logging.info('got line from subprocess: %r', line)

#make sure the supplied argument (val) ends
#with a file path separator
def ensureTrailingSlash(val):
    v2 = val.strip();
    if not v2.endswith(os.sep):
        v2 = v2 + os.sep
    return v2

#check to make sure the ssh command is available
def hasSSH():
    return shutil.which("ssh") is not None

#create a directory
def mkDir(path):
    try:  
        os.mkdir(path)
    except:  
        return False
    else:  
        return True

#parse a file and return the first line that
#doesn't start with a #
def getFirstNonComment(file):     
    with open(file) as f:
        foundLine = ""
        for line in f:
            if not string_helper.isBlank(line):
                checkline = line.strip()
                if not checkline.startswith('#'):
                    foundLine = checkline
                    break
        return foundLine
