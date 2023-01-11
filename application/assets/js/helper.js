const helper = (() => {
  let isOnline = function () {
    var xhttp = new XMLHttpRequest({
      mozSystem: true,
    });

    xhttp.open("GET", "https://google.com?" + new Date().getTime(), true);
    xhttp.timeout = 2500;
    xhttp.responseType = "document";
    xhttp.send();

    xhttp.onload = function () {
      if (
        xhttp.readyState === xhttp.DONE &&
        xhttp.status >= 200 &&
        xhttp.status < 304
      ) {
        return true;
      }

      if (xhttp.readyState === xhttp.DONE && xhttp.status != 200) {
        return false;
      }
    };

    xhhtp.onerror = function () {
      console.log("you are offline");
      return false;
    };
  };

  let getManifest = function (callback) {
    if (!navigator.mozApps) {
      let t = document.getElementById("kaios-ads");
      t.remove();
      return false;
    }
    let self = navigator.mozApps.getSelf();
    self.onsuccess = function () {
      callback(self.result);
    };
    self.onerror = function () {};
  };

  let queue = [];
  let timeout;
  let toaster = function (text, time) {
    queue.push({ text: text, time: time });
    if (queue.length === 1) {
      toast_q(text, time);
    }
  };

  let add_script = function (script) {
    document.body.appendChild(document.createElement("script")).src = script;
  };

  let toast_q = function (text, time) {
    var x = document.querySelector("div#toast");
    x.innerHTML = queue[0].text;

    x.style.transform = "translate(0px, 0px)";

    timeout = setTimeout(function () {
      timeout = null;
      x.style.transform = "translate(0px, -100px)";
      queue = queue.slice(1);
      if (queue.length > 0) {
        setTimeout(() => {
          toast_q(text, time);
        }, 1000);
      }
    }, time);
  };

  //side toaster

  let queue_st = [];
  let ttimeout;
  let side_toaster = function (text, time) {
    queue_st.push({ text: text, time: time });
    if (queue_st.length === 1) {
      toast_qq(text, time);
    }
  };

  let toast_qq = function (text, time) {
    var x = document.querySelector("div#side-toast");
    x.innerHTML = queue_st[0].text;

    x.style.transform = "translate(0vh, 0px)";

    timeout = setTimeout(function () {
      ttimeout = null;
      x.style.transform = "translate(-100vh,0px)";
      queue_st = queue.slice(1);
      if (queue_st.length > 0) {
        setTimeout(() => {
          toast_qq(text, time);
        }, 1000);
      }
    }, time);
  };

  //get location by ip
  let geoip = function (callback, key) {
    const url = "https://api.ipbase.com/v2/info?apikey=" + key;
    let xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.responseType = "json";
    xhr.send();
    xhr.error = function (err) {
      console.log(err);
    };

    xhr.onload = function () {
      let responseObj = xhr.response;
      console.log(responseObj);
      toaster(xhr.response.message, 5000);
      let latlng = [
        responseObj.data.location.latitude,
        responseObj.data.location.longitude,
      ];
      callback(latlng);
    };
  };

  //delete file
  let deleteFile = function (filename) {
    let sdcard = "";

    try {
      sdcard = navigator.getDeviceStorage("sdcard");
    } catch (e) {}

    if ("b2g" in navigator) {
      try {
        sdcard = navigator.b2g.getDeviceStorage("sdcard");
      } catch (e) {}
    }

    let requestDel = sdcard.delete(filename);

    requestDel.onsuccess = function () {
      helper.side_toaster("File successfully deleted", 2000);

      document.querySelector("[data-filepath='" + filename + "']").remove();
    };

    requestDel.onerror = function () {
      console.log("error");
      helper.toaster("Unable to delete the file: " + this.error);
    };
  };

  //search file
  let search_file = (name, callback) => {
    try {
      let finder = new Applait.Finder({
        type: "sdcard",
        debugMode: false,
      });
      finder.search(name);

      finder.on("searchComplete", function (needle, filematchcount) {});
      finder.on("fileFound", function (file, fileinfo, storageName) {
        callback(file);
      });
    } catch (e) {}

    if ("b2g" in navigator) {
      try {
        var sdcard = navigator.b2g.getDeviceStorage("sdcard");
        var iterable = sdcard.enumerate();
        var iterFiles = iterable.values();
        function next(_files) {
          _files
            .next()
            .then((file) => {
              if (!file.done) {
                if (file.value.name.includes(name)) {
                  callback(e);
                }
                next(_files);
              }
            })
            .catch(() => {
              next(_files);
            });
        }
        next(iterFiles);
      } catch (e) {
        console.log(e);
      }
    }
  };
  let list_files = (filetype, callback) => {
    if ("b2g" in navigator) {
      try {
        var sdcard = navigator.b2g.getDeviceStorage("sdcard");

        var iterable = sdcard.enumerate();
        var iterFiles = iterable.values();
        function next(_files) {
          _files
            .next()
            .then((file) => {
              if (!file.done) {
                let n = file.value.name.split(".");
                let file_type = n[n.length - 1];

                if (file_type == filetype) {
                  callback(file.value.name);
                }
                next(_files);
              }
            })
            .catch(() => {
              next(_files);
            });
        }
        next(iterFiles);
      } catch (e) {
        console.log(e);
      }
    }
  };

  //delete file
  let renameFile = function (filename, new_filename) {
    let sdcard = "";

    try {
      sdcard = navigator.getDeviceStorage("sdcard");
    } catch (e) {}

    if ("b2g" in navigator) {
      try {
        sdcard = navigator.b2g.getDeviceStorage("sdcard");
      } catch (e) {}
    }

    let request = sdcard.get(filename);
    // let new_filename = prompt("new filename");

    request.onsuccess = function () {
      let data = this.result;

      let file_extension = data.name.split(".");
      file_extension = file_extension[file_extension.length - 1];

      let filepath = data.name.split("/").slice(0, -1).join("/") + "/";

      let requestAdd = sdcard.addNamed(
        data,
        filepath + new_filename + "." + file_extension
      );
      requestAdd.onsuccess = function () {
        var request_del = sdcard.delete(data.name);

        request_del.onsuccess = function () {
          // success copy and delete

          document.querySelector(
            "[data-filepath='" + filename + "']"
          ).innerText = new_filename + "." + file_extension;

          side_toaster("successfully renamed", 3000);
        };

        request_del.onerror = function () {
          // success copy not delete
          toaster("Unable to write the file", 3000);
        };
      };
      requestAdd.onerror = function () {
        toaster("Unable to write the file", 3000);
      };
    };

    request.onerror = function () {
      toaster("Unable to write the file", 3000);
    };
  };

  let downloadFile = function (filename, data, callback) {
    let sdcard = "";

    try {
      sdcard = navigator.getDeviceStorage("sdcard");
    } catch (e) {}

    if ("b2g" in navigator) {
      try {
        sdcard = navigator.b2g.getDeviceStorage("sdcard");
      } catch (e) {}
    }

    var filedata = new Blob([data]);

    var request = sdcard.addNamed(filedata, filename);
    request.onsuccess = function () {
      callback(filename, request.result);
    };

    request.onerror = function () {
      side_toaster("Unable to download the file", 2000);
    };
  };

  return {
    getManifest,
    toaster,
    add_script,
    deleteFile,
    isOnline,
    geoip,
    side_toaster,
    renameFile,
    downloadFile,
    search_file,
    list_files,
  };
})();

if (window.NodeList && !NodeList.prototype.forEach) {
  NodeList.prototype.forEach = Array.prototype.forEach;
}

function notify(param_title, param_text, param_silent) {
  var options = {
    body: param_text,
    silent: true,
  };
  // Let's check if the browser supports notifications
  if (!("Notification" in window)) {
    alert("This browser does not support desktop notification");
  }

  // Let's check whether notification permissions have already been granted
  else if (Notification.permission === "granted") {
    // If it's okay let's create a notification
    var notification = new Notification(param_title, options);
  }

  // Otherwise, we need to ask the user for permission
  else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(function (permission) {
      // If the user accepts, let's create a notification
      if (permission === "granted") {
        var notification = new Notification(param_title, options);
      }
    });
  }
}

function localStorageWriteRead(item, value) {
  if (
    item != "" &&
    value != "" &&
    value != "undefined" &&
    item != "undefined"
  ) {
    localStorage.setItem(item, value);
  }

  return localStorage.getItem(item);
}

//delete file

//bottom bar
function bottom_bar(left, center, right) {
  document.querySelector("div#bottom-bar div#button-left").textContent = left;
  document.querySelector("div#bottom-bar div#button-center").textContent =
    center;
  document.querySelector("div#bottom-bar div#button-right").textContent = right;

  if (left == "" && center == "" && right == "") {
    document.querySelector("div#bottom-bar").style.display = "none";
  } else {
    document.querySelector("div#bottom-bar").style.display = "block";
  }
}

//top bar
function top_bar(left, center, right) {
  document.querySelector("div#top-bar div.button-left").textContent = left;
  document.querySelector("div#top-bar div.button-center").textContent = center;
  document.querySelector("div#top-bar div.button-right").textContent = right;

  if (left == "" && center == "" && right == "") {
    document.querySelector("div#top-bar").style.display = "none";
  } else {
    document.querySelector("div#top-bar").style.display = "block";
  }
}

function screenWakeLock(param, lock_type) {
  let lock;
  if (window.navigator.requestWakeLock == "is not a function") return false;
  if (param == "lock") {
    lock = window.navigator.requestWakeLock(lock_type);
    return false;
  }

  if (param == "unlock") {
    if (lock.topic == lock_type) {
      lock.unlock();
    }
  }
}

let update_file = function (filepath, storage) {
  let sdcard = navigator.getDeviceStorages("sdcard");
  let request = sdcard[storage].get(filepath);

  request.onsuccess = function () {
    //read file
    let fileget = this.result;
    //get file extension
    let file_extension = fileget.name.split(".");
    file_extension = file_extension[file_extension.length - 1];

    //mode content
    //to do

    //delete file
    var request_del = sdcard[storage].delete(filepath);

    request_del.onsuccess = function () {
      //add file
      let requestAdd = sdcard[storage].addNamed(
        fileget,
        filepath + "." + file_extension
      );
      requestAdd.onsuccess = function () {};
      requestAdd.onerror = function () {};
    };

    request_del.onerror = function () {
      // success copy not delete
      alert("Unable to remove the file: " + this.error);
    };
  };

  request.onerror = function () {
    alert(this.error);
  };
};

let add_file = function () {
  var sdcard = navigator.getDeviceStorage("sdcard");
  var file = new Blob(['[{"markers":[]}]'], {
    type: "application/json",
  });

  var request = sdcard.addNamed(file, "omap.json");

  request.onsuccess = function () {
    var name = this.result;
    toaster("Please repeat the last action again.", 2000);
  };

  // An error typically occur if a file with the same name already exist
  request.onerror = function () {
    alert("Unable to write the file: " + this.error);
  };
};

let now = function () {
  let current_datetime = new Date();
  let now =
    current_datetime.getFullYear() +
    "-" +
    (current_datetime.getMonth() + 1) +
    "-" +
    current_datetime.getDate() +
    "_" +
    current_datetime.getHours();
  return now;
};
