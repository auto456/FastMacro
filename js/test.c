//Check if shm return is 0 
#include <errno.h>
#include <unistd.h>
#include <stdio.h>
#include <sys/socket.h>
#include <sys/types.h>
#include <stdlib.h>
#include <netinet/in.h>
#include <string.h>
#include "../grovepi.h"
#include "arpa/inet.h"
#include <time.h>
#include <sys/shm.h>
#include <sys/ipc.h>
#include <sys/wait.h>
#include <sys/stat.h> 
#include <fcntl.h>
#include <sys/file.h>

#define PORT 5678



//Struct for all sensors
typedef struct
  {
    float temperature;
    float humidity;
    int light;
    int sound;
  } sensorData;

  //Struct for connection array with sensorData
  typedef struct
  {
    char *timestamp;
    char *IPAdress;
    sensorData min;
    sensorData max;
    sensorData cur;
  } ChildConnection;

  //SharedMemory for connection and connectionCounter
  int connectionShm, countShm = 0;
  //Count variable for connectionCounter SHM
  int *count = 0;

//Struct for lockfile
  struct stat st0, st1, st2, st3;
  int fd1, fd2;

/* ************************************************************ */
/* ************************************************************ */
/* **********************Get Sensor Data*********************** */
float getTemp()
{
  int tempHumPort = 8; //Sensor an D8
  float temp = 0;

  init();                      //Initialisierung des GrovePi's
  pinMode(tempHumPort, INPUT); //Modus festlegen
  pi_sleep(1000);              //wait 1s

  getTemperature(&temp, tempHumPort);
  printf("[temp = %.02f C]\n", temp);

  return temp;
}

float getHum()
{
  int tempHumPort = 8; //Sensor an D8
  float humidity = 0;

  init();                      //Initialisierung des GrovePi's
  pinMode(tempHumPort, INPUT); //Modus festlegen
  pi_sleep(1000);              //wait 1s

  getHumidity(&humidity, tempHumPort);
  printf("[humidity = %.02f%%]\n", humidity);

  return humidity;
}

int getLight()
{
  int lightPort = 0; //Analog Port A0
  int value;

  init(); //Initialisierung des GrovePi's
  pinMode(lightPort, INPUT);

  pi_sleep(1000);

  value = analogRead(lightPort);
  printf("LightValue: %d\n", value);

  return value;
}

int getSound()
{
  int soundPort = 1; //Analog Port A1
  int sound = 0;

  init(); //Initialisierung des GrovePi's
  pinMode(soundPort, INPUT);

  pi_sleep(1000);

  sound = analogRead(soundPort);
  printf("Sound: %d\n", sound);

  return sound;
}

int getWater()
{
  int waterPort = 2; //Analog Port A2
  int water = 0;

  init(); //Initialisierung des GrovePi's
  pinMode(waterPort, INPUT);

  pi_sleep(1000);

  water = analogRead(waterPort);
  printf("Water: %d\n", water);

  return water;
}

int getMotion()
{
  int motionPort = 6; //Digital Port D6

  init(); //Initialisierung des GrovePi's
  pinMode(motionPort, INPUT);

  pi_sleep(1000);

  return digitalRead(motionPort);
}

int getCollision()
{
  int collisionPort = 5; //Digital Port D5

  init(); //Initialisierung des GrovePi's
  pinMode(collisionPort, INPUT);

  pi_sleep(1000);

  int isTriggered()
  {
    if (!digitalRead(collisionPort))
    {
      pi_sleep(50);
      if (!digitalRead(collisionPort))
        return 1;
    }
    return 0;
  }

  int retrunValue = isTriggered();
  return retrunValue;
}
/* ************************************************************ */

void initalize()
{
 // ChildConnection *ChildArray = shmat(connectionShm, 0, 0);
  
//TODO: check after shmget if connectionSHM and countSHM == -1 -> printf ("Fehler bei key %d, mit der Größe %d\n", IPC_PRIVATE, SHMDATASIZE);
  
  connectionShm = shmget(IPC_PRIVATE, sizeof(ChildConnection)* 5, IPC_CREAT | 0666);
  countShm = shmget(IPC_PRIVATE, sizeof(int), IPC_CREAT | 0666);
  
  printf("connectionShm Value: %d countShm Value: %d", connectionShm, countShm);
 // if(connectionShm == -1 && countShm == -1){
 //   printf("Fehler bei key %d\n", IPC_PRIVATE);
 // }
  count = (int *)shmat(countShm, 0, 0);
  *count = 0;
}

/* Server listen and accept new connections from other clients and handles their request */
void parallelServer()
{
  int socket_fd, new_socket, valread;
  struct sockaddr_in client;
  int opt = 1;
  int cli_len = sizeof(client);
  char buffer_in[2000];
  char *buffer_out;
  pid_t childpid;

  // Creating socket file descriptor
  socket_fd = socket(AF_INET, SOCK_STREAM, 0);

  if (socket_fd < 0)
  {
    perror("socket failed");
    exit(EXIT_FAILURE);
  }

  // Forcefully attaching socket to address
  if (setsockopt(socket_fd, SOL_SOCKET, SO_REUSEADDR | SO_REUSEPORT,
                 &opt, sizeof(opt)))
  {
    perror("setsockopt");
    exit(EXIT_FAILURE);
  }

  client.sin_family = AF_INET;
  client.sin_addr.s_addr = INADDR_ANY;
  client.sin_port = htons(PORT);

  // Forcefully attaching socket to the port 5678
  if (bind(socket_fd, (struct sockaddr *)&client,
           sizeof(client)) < 0)
  {
    perror("bind failed");
    exit(EXIT_FAILURE);
  }

  if (listen(socket_fd, 5) < 0)
  {
    perror("listen");
    exit(EXIT_FAILURE);
  }
  while(1) {
        /*Key for opening the lockfile will be saved in fd.
        * O_CREAT creates file, if it doesn't exist before.
        * S_IRWXU read, write, execute Permissions
        */
    	int fd2 = open("lockFile2", O_CREAT, S_IRWXU);
	    printf("value of fd2: %d\n", fd2);

        /*LOCK_EX = exclusive lock. Only one process may hold
        * an exclusive lock for one given file at a given time.
        * LOCK_NB = A call to flock() may block if an 
        * incompatible lock is held by another process.
        * If flock returns -1, flock wasn't successful and
        * the global variable errno is set to indicate the error.
        */
        if (flock(fd2, LOCK_EX|LOCK_NB ) == -1) {
            /*EWOULDBLOCK is the same as EAGAIN
            * and means that the resource is temporarily
            * unavailable.
            */
    		if (errno == EWOULDBLOCK) {
            perror("perror");
        	printf("lock file is locked\n");
			printf("another instance is running"); 
			return -1;
    		} else {
                perror("perror");
            	printf("lock file is locked\n");
            	printf("another bla  bla");
				return -1;        	
 			}// end if
          
	    } else {
    		flock(fd2, LOCK_EX );
    		printf("lock file was unlocked, but is locked now\n");
	    } // end if

        /*fstat return information about a file.
        * return 0 = success; -1 = error. errno will be set.
        * fstat saves stats in a buffer and uses the fd
        */
        fstat(fd2, &st2);
      	/*stat is the same as fstat, but doesn't use the fd.
        * It uses the path to the lock file.
        */
        stat("lockFile2", &st3);
		printf("fstat value: %i\n", st2);
        printf("stat value: %i\n", st3);
      
        if(st2.st_ino == st3.st_ino){
			printf("in der if drinnen\n");
			break;
		}

        close(fd2);
		printf("fd2 closed\n");
    }
  
  
 while (1)
  {

    if ((new_socket = accept(socket_fd, (struct sockaddr *)&client,
                             (socklen_t *)&cli_len)) < 0)
    {
      perror("accept");
      exit(EXIT_FAILURE);
    }

    if ((childpid = fork()) == 0)
    {
     close(socket_fd);

    *count+=1;

	time_t current_time;
	char *c_time_string;
	current_time = time(NULL);
	c_time_string = ctime(&current_time);
	char buf[INET_ADDRSTRLEN];
	inet_ntop(AF_INET, &(client.sin_addr), buf, sizeof(buf));

	printf("Client with IP Address %s connected at time: %s\n", buf, c_time_string);

	printf("Count is %i", *count);
	ChildConnection *ChildArray = (ChildConnection *)shmat(connectionShm, 0,0);
	ChildArray[*count].timestamp = c_time_string;
	//memcpy(ChildArray[*count].timestamp, c_time_string, sizeof(c_time_string));
	ChildArray[*count].IPAdress = buf;
	printf("Client with IP Address %s connected at time: %s. Counter is at Position %i of 5.\n", ChildArray[*count].IPAdress, ChildArray[*count].timestamp, *count);
      
      while (1)
      {
        char menue[1000] = "Befehl waehlen: |GET [T]emperature| |GET [H]umidity| |GET [L]ight| |GET [S]ound|\n\n";

        write(new_socket, menue, sizeof(menue));
        memset(buffer_in, 0, 20);
        int nothingFound = 1;
        while (nothingFound)
        {
          int lengthOfBuffer;
          memset(buffer_in, 0, 20);
          read(new_socket, buffer_in, sizeof(buffer_in));

          if (strcmp(buffer_in, "GET TEMPERATURE") == 10)
          {
            float result = getTemp();
            char output[20];
            snprintf(output, sizeof(output), "%f", result);
            buffer_out = output;
            lengthOfBuffer = sizeof(output);
            write(new_socket, buffer_out, lengthOfBuffer);
            nothingFound = 0;
          }

          if (strcmp(buffer_in, "GET HUMIDITY") == 10)
          {
            int result = getHum();
            char output[20];
            printf("%d", sizeof(result));
            snprintf(output, sizeof(output), "%d", result);
            buffer_out = output;
            lengthOfBuffer = sizeof(output);
            write(new_socket, buffer_out, lengthOfBuffer);
            nothingFound = 0;
          }

          if (strcmp(buffer_in, "GET LIGHT") == 10)
          {
            float result = getLight();
            printf("%d", sizeof(result));
            char output[20];
            snprintf(output, sizeof(output), "%f", result);
            buffer_out = output;
            lengthOfBuffer = sizeof(output);
            write(new_socket, buffer_out, lengthOfBuffer);
            nothingFound = 0;
          }

          if (strcmp(buffer_in, "GET SOUND") == 10)
          {
            int result = getSound();
            char output[20];
            printf("%d", sizeof(result));
            snprintf(output, sizeof(output), "%d", result);
            buffer_out = output;
            lengthOfBuffer = sizeof(output);
            write(new_socket, buffer_out, lengthOfBuffer);
            nothingFound = 0;
          }
        }
      }
      close(new_socket);
         //unlink deletes the file, if no processes have the file open
    	unlink("lockFile2");
    	printf("lockFile2 unlinked\n");
      break;
    }
  }
}

void serverInteractsWithClient()
{
  //Count variable for connectionCounter SHM
  int *count = 0;
  //Connection SHM
  //connectionShm = shmget(IPC_PRIVATE, 5 * sizeof(ChildConnection), 0666);
  //ChildConnection *ChildArray = shmat(connectionShm, 0, 0);
  //ConnectionCounter SHMFF
  //countShm = shmget(IPC_PRIVATE, sizeof(int), 0666);
  //count = (int *)shmat(countShm, 0, 0);

while(1){
  int input =0;

 printf("\nTo connect with other Servers type in: 1\n");
  printf("To list all Peers type in : 2\n");

  printf("Your Input: \n");
  scanf("%d", &input);
  //CONNECT 192.168.2.13 5678

  if(input == 1){
    printf("\nConnect to IP ADRESS: \n");
    char inAdress[50];
    char inPort[10];
    scanf("%s", &inAdress);
    printf("\nConnect on PORT: \n");
    scanf("%s", &inPort);

    int clientSocket;
			char recvBuffer[20];
			char sendBuffer[20];
			struct sockaddr_in serverAddr;
			socklen_t addr_size;

			clientSocket = socket(AF_INET, SOCK_STREAM, 0);
			if (clientSocket == -1)
			{
				printf("Could not create socket");
			}
			serverAddr.sin_addr.s_addr = inet_addr(inAdress);
			serverAddr.sin_family = AF_INET;
			serverAddr.sin_port = htons((int) *inPort);

			connect(clientSocket, (struct sockaddr *)&serverAddr, addr_size);
      printf("Current PID: %d\n", getpid());
	pid_t grandchild = fork();
      if(grandchild == 0){
        printf("running while loop");
        int firstRun = 1;
			  while(1) {
        /*Key for opening the lockfile will be saved in fd.
        * O_CREAT creates file, if it doesn't exist before.
        * S_IRWXU read, write, execute Permissions
        */
    	int fd1 = open("lockFile1", O_CREAT, S_IRWXU);
	    printf("value of fd1: %d\n", fd1);

        /*LOCK_EX = exclusive lock. Only one process may hold
        * an exclusive lock for one given file at a given time.
        * LOCK_NB = A call to flock() may block if an 
        * incompatible lock is held by another process.
        * If flock returns -1, flock wasn't successful and
        * the global variable errno is set to indicate the error.
        */
        if (flock(fd1, LOCK_EX|LOCK_NB ) == -1) {
            /*EWOULDBLOCK is the same as EAGAIN
            * and means that the resource is temporarily
            * unavailable.
            */
    		if (errno == EWOULDBLOCK) {
            perror("perror");
        	printf("lock file is locked\n");
			printf("another instance is running"); 
			return -1;
    		} else {
                perror("perror");
            	printf("lock file is locked\n");
            	printf("another bla  bla");
				return -1;        	
 			}// end if
          
	    } else {
    		flock(fd1, LOCK_EX );
    		printf("lock file was unlocked, but is locked now\n");
	    } // end if

        /*fstat return information about a file.
        * return 0 = success; -1 = error. errno will be set.
        * fstat saves stats in a buffer and uses the fd
        */
        fstat(fd1, &st0);
      	/*stat is the same as fstat, but doesn't use the fd.
        * It uses the path to the lock file.
        */
        stat("lockFile1", &st1);
		printf("fstat value: %i\n", st0);
        printf("stat value: %i\n", st1);
      
        if(st0.st_ino == st1.st_ino){
			printf("in der if drinnen\n");
			break;
		}

        close(fd1);
		printf("fd1 closed\n");
    }
			while (1)
			{
				memset(recvBuffer, 0, 20);
				send(clientSocket, "GET TEMPERATURE", 15, 0);
				//recv(clientSocket, recvBuffer, 20, 0);
              			strcpy(recvBuffer, "40");
				ChildConnection *ChildArray = shmat(connectionShm, 0,0);
				ChildArray[*count].cur.temperature = (float) *recvBuffer;
				if (firstRun == 1)
				{
					ChildArray[*count].max.temperature = (float) *recvBuffer;
					ChildArray[*count].min.temperature = (float) *recvBuffer;
				}
				if (ChildArray[*count].cur.temperature > ChildArray[*count].max.temperature)
				{
					ChildArray[*count].max.temperature = (float) *recvBuffer;
				}
				if (ChildArray[*count].cur.temperature < ChildArray[*count].min.temperature)
				{
					ChildArray[*count].min.temperature = (float) *recvBuffer;
				}
				memset(recvBuffer, 0, 20);
				send(clientSocket, "GET HUMIDITY", 12, 0);
				//recv(clientSocket, recvBuffer, 20, 0);
				strcpy(recvBuffer,"40");
              			ChildArray[*count].cur.humidity = (float) *recvBuffer;
				if (firstRun == 1)
				{
					ChildArray[*count].max.humidity = (float) *recvBuffer;
					ChildArray[*count].min.humidity = (float) *recvBuffer;
				}
				if (ChildArray[*count].cur.humidity > ChildArray[*count].min.humidity)
				{
					ChildArray[*count].max.humidity = (float) *recvBuffer;
				}
				if (ChildArray[*count].cur.humidity < ChildArray[*count].min.humidity)
				{
					ChildArray[*count].min.humidity = (float) *recvBuffer;
				}
				memset(recvBuffer, 0, 20);
				send(clientSocket, "GET LIGHT", 9, 0);
			      	strcpy(recvBuffer, "40");	
				//recv(clientSocket, recvBuffer, 20, 0);
				ChildArray[*count].cur.light = (int) *recvBuffer;
				if (firstRun == 1)
				{
					ChildArray[*count].max.light = (int) *recvBuffer;
					ChildArray[*count].min.light = (int) *recvBuffer;
				}
				if (ChildArray[*count].cur.light > ChildArray[*count].max.light)
				{
					ChildArray[*count].max.light = (int) *recvBuffer;
				}
				if (ChildArray[*count].cur.light < ChildArray[*count].min.light)
				{
					ChildArray[*count].min.light = (int) *recvBuffer;
				}
				memset(recvBuffer, 0, 20);
				send(clientSocket, "GET SOUND", 9, 0);
		              	strcpy(recvBuffer, "40");
             			 //recv(clientSocket, recvBuffer, 20, 0);
				ChildArray[*count].cur.sound = (int) *recvBuffer;
				if (firstRun == 1)
				{
					ChildArray[*count].max.sound = (int) *recvBuffer;
					ChildArray[*count].min.sound = (int) *recvBuffer;
					firstRun = 0;
				}
				if (ChildArray[*count].cur.sound > ChildArray[*count].max.sound)
				{
					ChildArray[*count].max.sound = (int) *recvBuffer;
				}
				if (ChildArray[*count].cur.sound < ChildArray[*count].min.sound)
				{
					ChildArray[*count].min.sound = (int) *recvBuffer;
				}

				//Alles ausgeben
				printf("Current sensor data: \n");
				printf("TEMPERATURE: %d", ChildArray[*count].cur.temperature);
				printf("HUMIDITY: %d", ChildArray[*count].cur.humidity);
				printf("LIGHT: %d", ChildArray[*count].cur.light);
				printf("SOUND: %d", ChildArray[*count].cur.sound);
		//sleep(30);
      } 
      }
  } else if(input == 2){
        printf("input 2");
						printf("List of all Clients: \n");
						ChildConnection *ChildArray = shmat(connectionShm, 0, 0);
						for (int i =1; i < 6; i++)
						{
							printf("| Client with IP Address: %s connected at time: %s.|\n", ChildArray[i].IPAdress, ChildArray[i].timestamp);
							printf("| Temperature: |\n");
								printf("| Mininimum: %f | Current: %f | Maximum: %f |\n", ChildArray[i].min.temperature, ChildArray[i].cur.temperature, ChildArray[i].max.temperature);
							printf("| Humidity: |");
								printf("| Mininimum: %f | Current: %f | Maximum: %f |\n", ChildArray[i].min.humidity, ChildArray[i].cur.humidity, ChildArray[i].max.humidity);
							printf("| Light: |");
								printf("| Mininimum: %f | Current: %f | Maximum: %f |\n", ChildArray[i].min.light, ChildArray[i].cur.light, ChildArray[i].max.light);
							printf("| Sound: |");
								printf("| Mininimum: %f | Current: %f | Maximum: %f |\n", ChildArray[i].min.sound, ChildArray[i].cur.sound, ChildArray[i].max.sound);
						}

}
				}
 
}

void forkProcess()
{
  pid_t firstChild, secondChild;
  
  //creating first child
  firstChild = fork();
  
  //creating second child & "grand child"
  secondChild = fork();  
  
/* ************************Operation 1************************* */
  /* Server listen and accept new connections from other clients and handles their request */
  if (firstChild > 0 && secondChild > 0)
  {
    printf("Parent with PID: %d\n", getpid());    
    parallelServer();
    /* ************************Operation 2************************* */
  }
  else if (firstChild == 0 && secondChild > 0)
  {
    printf("First Child with PID: %d\n", getpid());
    serverInteractsWithClient();
  }
  //Errorcheck
  else if (firstChild > 0 && secondChild == 0)
  {
    printf("Second Child with PID: %d\n", getpid());
  }
  /* ************************Operation 3************************* */
else
  {
     printf("Third Child with PID: %d\n", getpid());
  }
}

int main()
  {  
  initalize();
  forkProcess();
  //return 0;

    return 1;
}