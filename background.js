function listener(details) {
    let filter = browser.webRequest.filterResponseData(details.requestId);
    let decoder = new TextDecoder("utf-8");
    let encoder = new TextEncoder();

    filter.ondata = event => {
        let str = decoder.decode(event.data, {stream: true});
        // Manipulate str
        
        try {
            let response = JSON.parse(str);
            if (response.data?.Page?.notifications) {
                
                let notifications = response.data.Page.notifications;
                
                notifications.forEach(notification => {
                    const displayText = notification.context;

                    let metaData;

                    if (!notification.user) {
                        metaData = {};
                    } else {
                        metaData = {
                            userId: notification.user.id,
                            activityType: notification.type,
                            createdAt: notification.createdAt,
                            activityId: notification.activityId
                        };
                    }
                    notification.context = {
                        displayText,
                        metaData
                    }
                });

                console.log(response);
                str = JSON.stringify(response);
            }
        } catch (error) {
            console.log(error);
            console.log('Not a parsable JSON response, skipping...');
            console.log(str);
        }
        


        filter.write(encoder.encode(str));
        filter.disconnect();
    }
}

browser.webRequest.onBeforeRequest.addListener(
  listener,
  {urls: ["https://anilist.co/graphql"]},
  ["blocking"]
);