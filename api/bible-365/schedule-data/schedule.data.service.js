const { Schedule } = require("../../../models/schedule");
const { ScheduleData } = require("../../../models/scheduledata");
const axios = require("axios");
const { response } = require("express");
const jsdom = require("jsdom");
const { map, lowerCase, trim } = require("lodash");
const pdf = require("html-pdf");
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(
  "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"
);

const validateScheduleId = async (scheduleId) => {
  if (isNaN(scheduleId)) {
    throw new Error("Invalid Schedule Id");
  }
  if (scheduleId <= 0 || scheduleId > 365) {
    throw new Error("Invalid Schedule Id");
  }
};

const getScheduleDataByScheduleId = async (scheduleId) => {
  const scheduleData = await ScheduleData.findOne()
    .where("schedule")
    .equals(scheduleId)
    .populate("schedule");

  if (!scheduleData) {
    await createScheduleDataByScheduleId(scheduleId);
    const newScheduleData = await ScheduleData.findOne()
      .where("schedule")
      .equals(scheduleId)
      .populate("schedule");
    return newScheduleData;
  }

  return scheduleData;
};

const createScheduleDataByScheduleId = async (scheduleId) => {
  //* - Get Schedule Information
  const schedule = await getScheduleById(scheduleId);

  //* - Generate schedule data object

  const scheduleDataObject = await generateScheduleDataObject(schedule);

  //* - Create New Schedule Data
  const scheduleData = new ScheduleData(scheduleDataObject);

  const response = await scheduleData.save();
  return response;
};

const getScheduleById = async (scheduleId) => {
  const schedule = await Schedule.findById(scheduleId).select(
    "firstReading secondReading psalm"
  );
  if (!schedule) {
    const exception = new Error("No Schedule found.");
    exception.statusCode = 400;
    throw exception;
  }

  return schedule;
};

const generateScheduleDataObject = async (schedule) => {
  try {
    let data = { schedule: schedule._id };
    //* FIRST READING
    let firstReading = await Promise.all(
      map(schedule.firstReading, async (reading) => {
        let verse = await getBibleTextByVerse(reading.verse);
        return {
          _id: reading._id,
          verse,
        };
      })
    );
    console.log(firstReading);
    //* SECOND READING
    let secondReading = await Promise.all(
      map(schedule.secondReading, async (reading) => {
        let verse = await getBibleTextByVerse(reading.verse);
        return {
          _id: reading._id,
          verse,
        };
      })
    );
    //* PSALM
    let psalm = await Promise.all(
      map(schedule.psalm, async (reading) => {
        let verse = await getBibleTextByVerse(reading.verse);
        return {
          _id: reading._id,
          verse,
        };
      })
    );
    data.firstReadingData = firstReading;
    data.secondReadingData = secondReading;
    data.psalmData = psalm;
    return data;
  } catch (error) {
    throw error;
  }
};

const getBibleTextByVerse = async (verse) => {
  if (!trim(verse)) {
    return null;
  }
  try {
    let updatedVerse = verse.replace(/\s+/g, "");
    const response = await axios.default.get(
      `https://www.biblegateway.com/passage/?search=${updatedVerse.toLowerCase()}&version=RSVCE`
    );
    const dom = new jsdom.JSDOM(response.data);

    const content = dom.window.document.querySelector(".passage-content>div");
    const footnotes = dom.window.document.querySelector(".footnotes");
    if (content) {
      if (footnotes) {
        content.removeChild(footnotes);
      }

      return content.innerHTML;
    } else {
      console.log(updatedVerse);
      throw new Error("Failed to get Bible Text.");
    }
  } catch (error) {
    throw new Error("Failed to get Bible Text.");
  }
};

exports.getByScheduleId = async (scheduleId) => {
  //* - Validate schedule id
  await validateScheduleId(scheduleId);
  //* - Get Schedule Data Information
  const data = await getScheduleDataByScheduleId(scheduleId);
  return data;
};

exports.sendEmail = async () => {
  const email = `
  <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">

<html xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
<!--[if gte mso 9]><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
<meta content="text/html; charset=utf-8" http-equiv="Content-Type"/>
<meta content="width=device-width" name="viewport"/>
<!--[if !mso]><!-->
<meta content="IE=edge" http-equiv="X-UA-Compatible"/>
<!--<![endif]-->
<title></title>
<!--[if !mso]><!-->
<link href="https://fonts.googleapis.com/css?family=Permanent+Marker" rel="stylesheet" type="text/css"/>
<link href="https://fonts.googleapis.com/css?family=Oswald" rel="stylesheet" type="text/css"/>
<link href="https://fonts.googleapis.com/css?family=Ubuntu" rel="stylesheet" type="text/css"/>
<link href="https://fonts.googleapis.com/css?family=Source+Sans+Pro" rel="stylesheet" type="text/css"/>
<link href="https://fonts.googleapis.com/css?family=Nunito" rel="stylesheet" type="text/css"/>
<!--<![endif]-->
<style type="text/css">
		body {
			margin: 0;
			padding: 0;
		}

		table,
		td,
		tr {
			vertical-align: top;
			border-collapse: collapse;
		}

		* {
			line-height: inherit;
		}

		a[x-apple-data-detectors=true] {
			color: inherit !important;
			text-decoration: none !important;
		}
	</style>
<style id="media-query" type="text/css">
		@media (max-width: 700px) {

			.block-grid,
			.col {
				min-width: 320px !important;
				max-width: 100% !important;
				display: block !important;
			}

			.block-grid {
				width: 100% !important;
			}

			.col {
				width: 100% !important;
			}

			.col_cont {
				margin: 0 auto;
			}

			img.fullwidth,
			img.fullwidthOnMobile {
				max-width: 100% !important;
			}

			.no-stack .col {
				min-width: 0 !important;
				display: table-cell !important;
			}

			.no-stack.two-up .col {
				width: 50% !important;
			}

			.no-stack .col.num2 {
				width: 16.6% !important;
			}

			.no-stack .col.num3 {
				width: 25% !important;
			}

			.no-stack .col.num4 {
				width: 33% !important;
			}

			.no-stack .col.num5 {
				width: 41.6% !important;
			}

			.no-stack .col.num6 {
				width: 50% !important;
			}

			.no-stack .col.num7 {
				width: 58.3% !important;
			}

			.no-stack .col.num8 {
				width: 66.6% !important;
			}

			.no-stack .col.num9 {
				width: 75% !important;
			}

			.no-stack .col.num10 {
				width: 83.3% !important;
			}

			.video-block {
				max-width: none !important;
			}

			.mobile_hide {
				min-height: 0px;
				max-height: 0px;
				max-width: 0px;
				display: none;
				overflow: hidden;
				font-size: 0px;
			}

			.desktop_hide {
				display: block !important;
				max-height: none !important;
			}
		}
	</style>
</head>
<body class="clean-body" style="margin: 0; padding: 0; -webkit-text-size-adjust: 100%; background-color: #f6f6f6;">
<!--[if IE]><div class="ie-browser"><![endif]-->
<table bgcolor="#f6f6f6" cellpadding="0" cellspacing="0" class="nl-container" role="presentation" style="table-layout: fixed; vertical-align: top; min-width: 320px; border-spacing: 0; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f6f6f6; width: 100%;" valign="top" width="100%">
<tbody>
<tr style="vertical-align: top;" valign="top">
<td style="word-break: break-word; vertical-align: top;" valign="top">
<!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="background-color:#f6f6f6"><![endif]-->
<div style="background-color:#ffffff;">
<div class="block-grid three-up" style="min-width: 320px; max-width: 680px; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; Margin: 0 auto; background-color: transparent;">
<div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
<!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;"><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:680px"><tr class="layout-full-width" style="background-color:transparent"><![endif]-->
<!--[if (mso)|(IE)]><td align="center" width="226" style="background-color:transparent;width:226px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top:25px; padding-bottom:0px;"><![endif]-->
<div class="col num4" style="display: table-cell; vertical-align: top; max-width: 320px; min-width: 224px; width: 226px;">
<div class="col_cont" style="width:100% !important;">
<!--[if (!mso)&(!IE)]><!-->
<div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:25px; padding-bottom:0px; padding-right: 0px; padding-left: 0px;">
<!--<![endif]-->
<div></div>
<!--[if (!mso)&(!IE)]><!-->
</div>
<!--<![endif]-->
</div>
</div>
<!--[if (mso)|(IE)]></td></tr></table><![endif]-->
<!--[if (mso)|(IE)]></td><td align="center" width="226" style="background-color:transparent;width:226px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top:20px; padding-bottom:20px;"><![endif]-->
<div class="col num4" style="display: table-cell; vertical-align: top; max-width: 320px; min-width: 224px; width: 226px;">
<div class="col_cont" style="width:100% !important;">
<!--[if (!mso)&(!IE)]><!-->
<div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:20px; padding-bottom:20px; padding-right: 0px; padding-left: 0px;">
<!--<![endif]-->
<!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 10px; padding-left: 10px; padding-top: 10px; padding-bottom: 10px; font-family: Arial, sans-serif"><![endif]-->
<!--[if mso]></td></tr></table><![endif]-->
<!--[if (!mso)&(!IE)]><!-->
</div>
<!--<![endif]-->
</div>
</div>
<!--[if (mso)|(IE)]></td></tr></table><![endif]-->
<!--[if (mso)|(IE)]></td><td align="center" width="226" style="background-color:transparent;width:226px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top:20px; padding-bottom:20px;"><![endif]-->
<div class="col num4" style="display: table-cell; vertical-align: top; max-width: 320px; min-width: 224px; width: 226px;">
<div class="col_cont" style="width:100% !important;">
<!--[if (!mso)&(!IE)]><!-->
<div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:20px; padding-bottom:20px; padding-right: 0px; padding-left: 0px;">
<!--<![endif]-->
<div></div>
<!--[if (!mso)&(!IE)]><!-->
</div>
<!--<![endif]-->
</div>
</div>
<!--[if (mso)|(IE)]></td></tr></table><![endif]-->
<!--[if (mso)|(IE)]></td></tr></table></td></tr></table><![endif]-->
</div>
</div>
</div>
<div style="background-image:url('https://i.imgur.com/I1KtXND.png');background-position:center top;background-repeat:no-repeat;background-color:#ffffff;">
<div class="block-grid two-up" style="min-width: 320px; max-width: 680px; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; Margin: 0 auto; background-color: transparent;">
<div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;;direction:rtl">
<!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-image:url('https://i.imgur.com/I1KtXND.png');background-position:center top;background-repeat:no-repeat;background-color:#ffffff;"><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:680px"><tr class="layout-full-width" style="background-color:transparent"><![endif]-->
<!--[if (mso)|(IE)]><td align="center" width="340" style="background-color:transparent;width:340px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top:60px; padding-bottom:60px;"><![endif]-->
<div class="col num6" style="display: table-cell; vertical-align: top; max-width: 320px; min-width: 336px; width: 340px; direction: ltr;">
<div class="col_cont" style="width:100% !important;">
<!--[if (!mso)&(!IE)]><!-->
<div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:60px; padding-bottom:60px; padding-right: 0px; padding-left: 0px;">
<!--<![endif]-->
<div align="center" class="img-container center autowidth" style="padding-right: 0px;padding-left: 0px;">
<!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr style="line-height:0px"><td style="padding-right: 0px;padding-left: 0px;" align="center"><![endif]--><img align="center" alt="Hero Image" border="0" class="center autowidth" src="https://i.imgur.com/a7xs1g5.jpg" style="text-decoration: none; -ms-interpolation-mode: bicubic; height: auto; border: 0; width: 100%; max-width: 340px; display: block;" title="Hero Image" width="340"/>
<!--[if mso]></td></tr></table><![endif]-->
</div>
<!--[if (!mso)&(!IE)]><!-->
</div>
<!--<![endif]-->
</div>
</div>
<!--[if (mso)|(IE)]></td></tr></table><![endif]-->
<!--[if (mso)|(IE)]></td><td align="center" width="340" style="background-color:transparent;width:340px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 10px; padding-top:30px; padding-bottom:30px;"><![endif]-->
<div class="col num6" style="display: table-cell; vertical-align: top; max-width: 320px; min-width: 336px; width: 340px; direction: ltr;">
<div class="col_cont" style="width:100% !important;">
<!--[if (!mso)&(!IE)]><!-->
<div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:30px; padding-bottom:30px; padding-right: 0px; padding-left: 10px;">
<!--<![endif]-->
<!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 10px; padding-left: 10px; padding-top: 10px; padding-bottom: 10px; font-family: Arial, sans-serif"><![endif]-->
<!--[if mso]></td></tr></table><![endif]-->
<!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 5px; padding-left: 10px; padding-top: 5px; padding-bottom: 10px; font-family: Arial, sans-serif"><![endif]-->
<div style="color:#ff5c5c;font-family:Helvetica Neue, Helvetica, Arial, sans-serif;line-height:1.2;padding-top:5px;padding-right:5px;padding-bottom:10px;padding-left:10px;">
<div style="line-height: 1.2; font-size: 12px; color: #ff5c5c; font-family: Helvetica Neue, Helvetica, Arial, sans-serif; mso-line-height-alt: 14px;">
<p style="font-size: 72px; line-height: 1.2; word-break: break-word; mso-line-height-alt: 86px; margin: 0;"><span style="font-size: 72px;"><strong>The Bible in a Year</strong></span></p>
</div>
</div>
<!--[if mso]></td></tr></table><![endif]-->
<!--[if (!mso)&(!IE)]><!-->
</div>
<!--<![endif]-->
</div>
</div>
<!--[if (mso)|(IE)]></td></tr></table><![endif]-->
<!--[if (mso)|(IE)]></td></tr></table></td></tr></table><![endif]-->
</div>
</div>
</div>
<div style="background-color:transparent;">
<div class="block-grid" style="min-width: 320px; max-width: 680px; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; Margin: 0 auto; background-color: transparent;">
<div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
<!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:transparent;"><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:680px"><tr class="layout-full-width" style="background-color:transparent"><![endif]-->
<!--[if (mso)|(IE)]><td align="center" width="680" style="background-color:transparent;width:680px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top:50px; padding-bottom:5px;"><![endif]-->
<div class="col num12" style="min-width: 320px; max-width: 680px; display: table-cell; vertical-align: top; width: 680px;">
<div class="col_cont" style="width:100% !important;">
<!--[if (!mso)&(!IE)]><!-->
<div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:50px; padding-bottom:5px; padding-right: 0px; padding-left: 0px;">
<!--<![endif]-->
<!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 10px; padding-left: 10px; padding-top: 10px; padding-bottom: 10px; font-family: Arial, sans-serif"><![endif]-->
<!--[if mso]></td></tr></table><![endif]-->
<!--[if (!mso)&(!IE)]><!-->
</div>
<!--<![endif]-->
</div>
</div>
<!--[if (mso)|(IE)]></td></tr></table><![endif]-->
<!--[if (mso)|(IE)]></td></tr></table></td></tr></table><![endif]-->
</div>
</div>
</div>
<div style="background-color:transparent;">
<div class="block-grid" style="min-width: 320px; max-width: 680px; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; Margin: 0 auto; background-color: transparent;">
<div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
<!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:transparent;"><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:680px"><tr class="layout-full-width" style="background-color:transparent"><![endif]-->
<!--[if (mso)|(IE)]><td align="center" width="680" style="background-color:transparent;width:680px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top:5px; padding-bottom:5px;"><![endif]-->
<div class="col num12" style="min-width: 320px; max-width: 680px; display: table-cell; vertical-align: top; width: 680px;">
<div class="col_cont" style="width:100% !important;">
<!--[if (!mso)&(!IE)]><!-->
<div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:5px; padding-bottom:5px; padding-right: 0px; padding-left: 0px;">
<!--<![endif]-->
<!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 10px; padding-left: 10px; padding-top: 10px; padding-bottom: 10px; font-family: Arial, sans-serif"><![endif]-->
<div style="color:#ff5c5c;font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;line-height:1.2;padding-top:10px;padding-right:10px;padding-bottom:10px;padding-left:10px;">
<div style="line-height: 1.2; font-size: 12px; color: #ff5c5c; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; mso-line-height-alt: 14px;">
<p style="text-align: center; line-height: 1.2; word-break: break-word; font-size: 34px; mso-line-height-alt: 41px; margin: 0;"><span style="font-size: 34px;"><strong><span style="">Day 7</span></strong></span></p>
</div>
</div>
<!--[if mso]></td></tr></table><![endif]-->
<!--[if (!mso)&(!IE)]><!-->
</div>
<!--<![endif]-->
</div>
</div>
<!--[if (mso)|(IE)]></td></tr></table><![endif]-->
<!--[if (mso)|(IE)]></td></tr></table></td></tr></table><![endif]-->
</div>
</div>
</div>
<div style="background-color:transparent;">
<div class="block-grid" style="min-width: 320px; max-width: 680px; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; Margin: 0 auto; background-color: transparent;">
<div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
<!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:transparent;"><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:680px"><tr class="layout-full-width" style="background-color:transparent"><![endif]-->
<!--[if (mso)|(IE)]><td align="center" width="680" style="background-color:transparent;width:680px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 15px; padding-left: 15px; padding-top:5px; padding-bottom:30px;"><![endif]-->
<div class="col num12" style="min-width: 320px; max-width: 680px; display: table-cell; vertical-align: top; width: 680px;">
<div class="col_cont" style="width:100% !important;">
<!--[if (!mso)&(!IE)]><!-->
<div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:5px; padding-bottom:30px; padding-right: 15px; padding-left: 15px;">
<!--<![endif]-->
<!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top: 10px; padding-bottom: 10px; font-family: Arial, sans-serif"><![endif]-->
<div style="color:#515c74;font-family:Helvetica Neue, Helvetica, Arial, sans-serif;line-height:1.5;padding-top:10px;padding-right:0px;padding-bottom:10px;padding-left:0px;">
<div style="line-height: 1.5; font-size: 12px; color: #515c74; font-family: Helvetica Neue, Helvetica, Arial, sans-serif; mso-line-height-alt: 18px;">
<p style="text-align: center; line-height: 1.5; word-break: break-word; font-size: 15px; mso-line-height-alt: 23px; margin: 0;"><span style="font-size: 15px;"><em>The Bible in a Year</em> follows a reading plan inspired by The Great Adventure Bible Timeline. The Psalms and Proverbs are spread out throughout the year to provide additional opportunity for prayer, reflection, and practical wisdom. </span></p>
</div>
</div>
<!--[if mso]></td></tr></table><![endif]-->
<!--[if (!mso)&(!IE)]><!-->
</div>
<!--<![endif]-->
</div>
</div>
<!--[if (mso)|(IE)]></td></tr></table><![endif]-->
<!--[if (mso)|(IE)]></td></tr></table></td></tr></table><![endif]-->
</div>
</div>
</div>
<div style="background-color:transparent;">
<div class="block-grid" style="min-width: 320px; max-width: 680px; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; Margin: 0 auto; background-color: transparent;">
<div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
<!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:transparent;"><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:680px"><tr class="layout-full-width" style="background-color:transparent"><![endif]-->
<!--[if (mso)|(IE)]><td align="center" width="680" style="background-color:transparent;width:680px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top:15px; padding-bottom:35px;"><![endif]-->
<div class="col num12" style="min-width: 320px; max-width: 680px; display: table-cell; vertical-align: top; width: 680px;">
<div class="col_cont" style="width:100% !important;">
<!--[if (!mso)&(!IE)]><!-->
<div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:15px; padding-bottom:35px; padding-right: 0px; padding-left: 0px;">
<!--<![endif]-->
<div></div>
<!--[if (!mso)&(!IE)]><!-->
</div>
<!--<![endif]-->
</div>
</div>
<!--[if (mso)|(IE)]></td></tr></table><![endif]-->
<!--[if (mso)|(IE)]></td></tr></table></td></tr></table><![endif]-->
</div>
</div>
</div>
<div style="background-color:#ff5c5c;">
<div class="block-grid" style="min-width: 320px; max-width: 680px; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; Margin: 0 auto; background-color: transparent;">
<div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
<!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ff5c5c;"><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:680px"><tr class="layout-full-width" style="background-color:transparent"><![endif]-->
<!--[if (mso)|(IE)]><td align="center" width="680" style="background-color:transparent;width:680px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top:40px; padding-bottom:5px;"><![endif]-->
<div class="col num12" style="min-width: 320px; max-width: 680px; display: table-cell; vertical-align: top; width: 680px;">
<div class="col_cont" style="width:100% !important;">
<!--[if (!mso)&(!IE)]><!-->
<div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:40px; padding-bottom:5px; padding-right: 0px; padding-left: 0px;">
<!--<![endif]-->
<!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 10px; padding-left: 10px; padding-top: 10px; padding-bottom: 10px; font-family: Arial, sans-serif"><![endif]-->
<!--[if mso]></td></tr></table><![endif]-->
<!--[if (!mso)&(!IE)]><!-->
</div>
<!--<![endif]-->
</div>
</div>
<!--[if (mso)|(IE)]></td></tr></table><![endif]-->
<!--[if (mso)|(IE)]></td></tr></table></td></tr></table><![endif]-->
</div>
</div>
</div>
<div style="background-color:#ff5c5c;">
<div class="block-grid" style="min-width: 320px; max-width: 680px; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; Margin: 0 auto; background-color: transparent;">
<div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
<!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ff5c5c;"><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:680px"><tr class="layout-full-width" style="background-color:transparent"><![endif]-->
<!--[if (mso)|(IE)]><td align="center" width="680" style="background-color:transparent;width:680px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top:60px; padding-bottom:30px;"><![endif]-->
<div class="col num12" style="min-width: 320px; max-width: 680px; display: table-cell; vertical-align: top; width: 680px;">
<div class="col_cont" style="width:100% !important;">
<!--[if (!mso)&(!IE)]><!-->
<div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:60px; padding-bottom:30px; padding-right: 0px; padding-left: 0px;">
<!--<![endif]-->
<!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top: 0px; padding-bottom: 0px; font-family: Arial, sans-serif"><![endif]-->
<div style="color:#515c74;font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;line-height:1.2;padding-top:0px;padding-right:0px;padding-bottom:0px;padding-left:0px;">
<div style="line-height: 1.2; font-size: 12px; color: #515c74; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; mso-line-height-alt: 14px;">
<p style="text-align: center; line-height: 1.2; word-break: break-word; font-size: 14px; mso-line-height-alt: 17px; margin: 0;"><span style="font-size: 14px;"><span style="">TIME PERIOD</span></span></p>
</div>
</div>
<!--[if mso]></td></tr></table><![endif]-->
<!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 10px; padding-left: 10px; padding-top: 10px; padding-bottom: 10px; font-family: Arial, sans-serif"><![endif]-->
<div style="color:#e6eef8;font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;line-height:1.2;padding-top:10px;padding-right:10px;padding-bottom:10px;padding-left:10px;">
<div style="line-height: 1.2; font-size: 12px; color: #e6eef8; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; mso-line-height-alt: 14px;">
<p style="text-align: center; line-height: 1.2; word-break: break-word; font-size: 34px; mso-line-height-alt: 41px; margin: 0;"><span style="font-size: 34px;"><strong><span style="">Early World</span></strong></span></p>
</div>
</div>
<!--[if mso]></td></tr></table><![endif]-->
<!--[if (!mso)&(!IE)]><!-->
</div>
<!--<![endif]-->
</div>
</div>
<!--[if (mso)|(IE)]></td></tr></table><![endif]-->
<!--[if (mso)|(IE)]></td></tr></table></td></tr></table><![endif]-->
</div>
</div>
</div>
<div style="background-color:#ff5c5c;">
<div class="block-grid" style="min-width: 320px; max-width: 680px; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; Margin: 0 auto; background-color: transparent;">
<div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
<!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ff5c5c;"><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:680px"><tr class="layout-full-width" style="background-color:transparent"><![endif]-->
<!--[if (mso)|(IE)]><td align="center" width="680" style="background-color:transparent;width:680px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 10px; padding-left: 10px; padding-top:5px; padding-bottom:30px;"><![endif]-->
<div class="col num12" style="min-width: 320px; max-width: 680px; display: table-cell; vertical-align: top; width: 680px;">
<div class="col_cont" style="width:100% !important;">
<!--[if (!mso)&(!IE)]><!-->
<div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:5px; padding-bottom:30px; padding-right: 10px; padding-left: 10px;">
<!--<![endif]-->
<!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 10px; padding-left: 10px; padding-top: 10px; padding-bottom: 10px; font-family: Arial, sans-serif"><![endif]-->
<div style="color:#515c74;font-family:Helvetica Neue, Helvetica, Arial, sans-serif;line-height:1.5;padding-top:10px;padding-right:10px;padding-bottom:10px;padding-left:10px;">
<div style="line-height: 1.5; font-size: 12px; color: #515c74; font-family: Helvetica Neue, Helvetica, Arial, sans-serif; mso-line-height-alt: 18px;">
<p style="line-height: 1.5; word-break: break-word; text-align: center; font-size: 15px; mso-line-height-alt: 23px; margin: 0;"><span style="font-size: 15px;">The Bible opens with a grand overture that prepares for all that is to follow (Gen 1-11). God creates the world, including human beings as the crown of creation. But their disobedience leads to a series of tragic consequences, including the first murder, a primeval flood, and the scattering of peoples at Babel. Genesis does not aim to give a scientific explanation of the origins of the universe. However, it often uses figurative language to describe real events(see CCC 390) that have profoundly influenced the history of the human race.</span></p>
</div>
</div>
<!--[if mso]></td></tr></table><![endif]-->
<!--[if (!mso)&(!IE)]><!-->
</div>
<!--<![endif]-->
</div>
</div>
<!--[if (mso)|(IE)]></td></tr></table><![endif]-->
<!--[if (mso)|(IE)]></td></tr></table></td></tr></table><![endif]-->
</div>
</div>
</div>
<div style="background-color:#ff5c5c;">
<div class="block-grid" style="min-width: 320px; max-width: 680px; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; Margin: 0 auto; background-color: transparent;">
<div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
<!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ff5c5c;"><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:680px"><tr class="layout-full-width" style="background-color:transparent"><![endif]-->
<!--[if (mso)|(IE)]><td align="center" width="680" style="background-color:transparent;width:680px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top:30px; padding-bottom:50px;"><![endif]-->
<div class="col num12" style="min-width: 320px; max-width: 680px; display: table-cell; vertical-align: top; width: 680px;">
<div class="col_cont" style="width:100% !important;">
<!--[if (!mso)&(!IE)]><!-->
<div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:30px; padding-bottom:50px; padding-right: 0px; padding-left: 0px;">
<!--<![endif]-->
<div></div>
<!--[if (!mso)&(!IE)]><!-->
</div>
<!--<![endif]-->
</div>
</div>
<!--[if (mso)|(IE)]></td></tr></table><![endif]-->
<!--[if (mso)|(IE)]></td></tr></table></td></tr></table><![endif]-->
</div>
</div>
</div>
<div style="background-color:transparent;">
<div class="block-grid" style="min-width: 320px; max-width: 680px; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; Margin: 0 auto; background-color: transparent;">
<div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
<!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:transparent;"><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:680px"><tr class="layout-full-width" style="background-color:transparent"><![endif]-->
<!--[if (mso)|(IE)]><td align="center" width="680" style="background-color:transparent;width:680px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top:40px; padding-bottom:5px;"><![endif]-->
<div class="col num12" style="min-width: 320px; max-width: 680px; display: table-cell; vertical-align: top; width: 680px;">
<div class="col_cont" style="width:100% !important;">
<!--[if (!mso)&(!IE)]><!-->
<div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:40px; padding-bottom:5px; padding-right: 0px; padding-left: 0px;">
<!--<![endif]-->
<!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 10px; padding-left: 10px; padding-top: 10px; padding-bottom: 10px; font-family: Arial, sans-serif"><![endif]-->
<!--[if mso]></td></tr></table><![endif]-->
<!--[if (!mso)&(!IE)]><!-->
</div>
<!--<![endif]-->
</div>
</div>
<!--[if (mso)|(IE)]></td></tr></table><![endif]-->
<!--[if (mso)|(IE)]></td></tr></table></td></tr></table><![endif]-->
</div>
</div>
</div>
<div style="background-color:transparent;">
<div class="block-grid" style="min-width: 320px; max-width: 680px; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; Margin: 0 auto; background-color: transparent;">
<div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
<!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:transparent;"><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:680px"><tr class="layout-full-width" style="background-color:transparent"><![endif]-->
<!--[if (mso)|(IE)]><td align="center" width="680" style="background-color:transparent;width:680px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top:60px; padding-bottom:30px;"><![endif]-->
<div class="col num12" style="min-width: 320px; max-width: 680px; display: table-cell; vertical-align: top; width: 680px;">
<div class="col_cont" style="width:100% !important;">
<!--[if (!mso)&(!IE)]><!-->
<div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:60px; padding-bottom:30px; padding-right: 0px; padding-left: 0px;">
<!--<![endif]-->
<!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top: 0px; padding-bottom: 0px; font-family: Arial, sans-serif"><![endif]-->
<div style="color:#515c74;font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;line-height:1.2;padding-top:0px;padding-right:0px;padding-bottom:0px;padding-left:0px;">
<div style="line-height: 1.2; font-size: 12px; color: #515c74; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; mso-line-height-alt: 14px;">
<p style="text-align: center; line-height: 1.2; word-break: break-word; font-size: 14px; mso-line-height-alt: 17px; margin: 0;"><span style="font-size: 14px;"><span style="">FIRST READING</span></span></p>
</div>
</div>
<!--[if mso]></td></tr></table><![endif]-->
<!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 10px; padding-left: 10px; padding-top: 10px; padding-bottom: 10px; font-family: Arial, sans-serif"><![endif]-->
<div style="color:#ff5c5c;font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;line-height:1.2;padding-top:10px;padding-right:10px;padding-bottom:10px;padding-left:10px;">
<div style="line-height: 1.2; font-size: 12px; color: #ff5c5c; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; mso-line-height-alt: 14px;">
<p style="text-align: center; line-height: 1.2; word-break: break-word; font-size: 34px; mso-line-height-alt: 41px; margin: 0;"><span style="font-size: 34px;"><strong><span style="">Genesis 14-15</span></strong></span></p>
</div>
</div>
<!--[if mso]></td></tr></table><![endif]-->
<!--[if (!mso)&(!IE)]><!-->
</div>
<!--<![endif]-->
</div>
</div>
<!--[if (mso)|(IE)]></td></tr></table><![endif]-->
<!--[if (mso)|(IE)]></td></tr></table></td></tr></table><![endif]-->
</div>
</div>
</div>
<div style="background-color:transparent;">
<div class="block-grid" style="min-width: 320px; max-width: 680px; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; Margin: 0 auto; background-color: transparent;">
<div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
<!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:transparent;"><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:680px"><tr class="layout-full-width" style="background-color:transparent"><![endif]-->
<!--[if (mso)|(IE)]><td align="center" width="680" style="background-color:transparent;width:680px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top:5px; padding-bottom:5px;"><![endif]-->
<div class="col num12" style="min-width: 320px; max-width: 680px; display: table-cell; vertical-align: top; width: 680px;">
<div class="col_cont" style="width:100% !important;">
<!--[if (!mso)&(!IE)]><!-->
<div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:5px; padding-bottom:5px; padding-right: 0px; padding-left: 0px;">
<!--<![endif]-->
<!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 10px; padding-left: 10px; padding-top: 10px; padding-bottom: 10px; font-family: Arial, sans-serif"><![endif]-->
<div style="color:#515c74;font-family:Helvetica Neue, Helvetica, Arial, sans-serif;line-height:1.5;padding-top:10px;padding-right:10px;padding-bottom:10px;padding-left:10px;">
<div style="line-height: 1.5; font-size: 12px; color: #515c74; font-family: Helvetica Neue, Helvetica, Arial, sans-serif; mso-line-height-alt: 18px;">
<p style="line-height: 1.5; word-break: break-word; text-align: left; font-size: 15px; mso-line-height-alt: 23px; margin: 0;">
<p style="font-size: 14px; line-height: 1.2; mso-line-height-alt: 17px; margin: 0;">\n <h3><span id="en-RSVCE-300\" class="text Gen-12-1\">The Call of Abram</span></h3><p class="chapter-2"><span class="text Gen-12-1"><span class="chapternum">12&nbsp;</span><sup data-fn="#fen-RSVCE-300a" class="footnote" data-link="[<a href=&quot;#fen-RSVCE-300a&quot; title=&quot;See footnote a&quot;>a</a>]">[<a href="#fen-RSVCE-300a" title="See footnote a">a</a>]</sup>Now the <span style="font-variant: small-caps" class="small-caps">Lord</span> said to Abram, “Go from your country and your kindred and your father’s house to the land that I will show you. </span> <span id="en-RSVCE-301" class="text Gen-12-2"><sup class="versenum">2&nbsp;</sup>And I will make of you a great nation, and I will bless you, and make your name great, so that you will be a blessing. </span> <span id="en-RSVCE-302" class="text Gen-12-3"><sup class="versenum">3&nbsp;</sup>I will bless those who bless you, and him who curses you I will curse; and by you all the families of the earth shall bless themselves.”<sup data-fn="#fen-RSVCE-302b" class="footnote" data-link="[<a href=&quot;#fen-RSVCE-302b&quot; title=&quot;See footnote b&quot;>b</a>]">[<a href="#fen-RSVCE-302b" title="See footnote b">b</a>]</sup></span></p> <p><span id="en-RSVCE-303" class="text Gen-12-4"><sup class="versenum">4&nbsp;</sup>So Abram went, as the <span style="font-variant: small-caps" class="small-caps">Lord</span> had told him; and Lot went with him. Abram was seventy-five years old when he departed from Haran. </span> <span id="en-RSVCE-304" class="text Gen-12-5"><sup class="versenum">5&nbsp;</sup>And Abram took Sar′ai his wife, and Lot his brother’s son, and all their possessions which they had gathered, and the persons that they had gotten in Haran; and they set forth to go to the land of Canaan. When they had come to the land of Canaan, </span> <span id="en-RSVCE-305" class="text Gen-12-6"><sup class="versenum">6&nbsp;</sup>Abram passed through the land to the place at Shechem, to the oak<sup data-fn="#fen-RSVCE-305c" class="footnote" data-link="[<a href=&quot;#fen-RSVCE-305c&quot; title=&quot;See footnote c&quot;>c</a>]">[<a href="#fen-RSVCE-305c" title="See footnote c">c</a>]</sup> of Moreh. At that time the Canaanites were in the land. </span> <span id="en-RSVCE-306" class="text Gen-12-7"><sup class="versenum">7&nbsp;</sup>Then the <span style="font-variant: small-caps" class="small-caps">Lord</span> appeared to Abram, and said, “To your descendants I will give this land.” So he built there an altar to the <span style="font-variant: small-caps" class="small-caps">Lord</span>, who had appeared to him. </span> <span id="en-RSVCE-307" class="text Gen-12-8"><sup class="versenum">8&nbsp;</sup>Thence he removed to the mountain on the east of Bethel, and pitched his tent, with Bethel on the west and Ai on the east; and there he built an altar to the <span style="font-variant: small-caps" class="small-caps">Lord</span> and called on the name of the <span style="font-variant: small-caps" class="small-caps">Lord</span>. </span> <span id="en-RSVCE-308" class="text Gen-12-9"><sup class="versenum">9&nbsp;</sup>And Abram journeyed on, still going toward the Negeb.</span></p> <h3><span id="en-RSVCE-309" class="text Gen-12-10">Abram and Sarai in Egypt</span></h3><p><span class="text Gen-12-10"><sup class="versenum">10&nbsp;</sup>Now there was a famine in the land. So Abram went down to Egypt to sojourn there, for the famine was severe in the land. </span> <span id="en-RSVCE-310" class="text Gen-12-11"><sup class="versenum">11&nbsp;</sup>When he was about to enter Egypt, he said to Sar′ai his wife, “I know that you are a woman beautiful to behold; </span> <span id="en-RSVCE-311" class="text Gen-12-12"><sup class="versenum">12&nbsp;</sup>and when the Egyptians see you, they will say, ‘This is his wife’; then they will kill me, but they will let you live. </span> <span id="en-RSVCE-312" class="text Gen-12-13"><sup class="versenum">13&nbsp;</sup>Say you are my sister, that it may go well with me because of you, and that my life may be spared on your account.” </span> <span id="en-RSVCE-313" class="text Gen-12-14"><sup class="versenum">14&nbsp;</sup>When Abram entered Egypt the Egyptians saw that the woman was very beautiful. </span> <span id="en-RSVCE-314" class="text Gen-12-15"><sup class="versenum">15&nbsp;</sup>And when the princes of Pharaoh saw her, they praised her to Pharaoh. And the woman was taken into Pharaoh’s house. </span> <span id="en-RSVCE-315" class="text Gen-12-16"><sup class="versenum">16&nbsp;</sup>And for her sake he dealt well with Abram; and he had sheep, oxen, he-asses, menservants, maidservants, she-asses, and camels.</span></p> <p><span id="en-RSVCE-316" class="text Gen-12-17"><sup class="versenum">17&nbsp;</sup>But the <span style="font-variant: small-caps" class="small-caps">Lord</span> afflicted Pharaoh and his house with great plagues because of Sar′ai, Abram’s wife. </span> <span id="en-RSVCE-317" class="text Gen-12-18"><sup class="versenum">18&nbsp;</sup>So Pharaoh called Abram, and said, “What is this you have done to me? Why did you not tell me that she was your wife? </span> <span id="en-RSVCE-318" class="text Gen-12-19"><sup class="versenum">19&nbsp;</sup>Why did you say, ‘She is my sister,’ so that I took her for my wife? Now then, here is your wife, take her, and be gone.” </span> <span id="en-RSVCE-319" class="text Gen-12-20"><sup class="versenum">20&nbsp;</sup>And Pharaoh gave men orders concerning him; and they set him on the way, with his wife and all that he had.</span></p> <h3><span id="en-RSVCE-320" class="text Gen-13-1">Abram and Lot Separate</span></h3><p class="chapter-2"><span class="text Gen-13-1"><span class="chapternum">13&nbsp;</span>So Abram went up from Egypt, he and his wife, and all that he had, and Lot with him, into the Negeb.</span></p> <p><span id="en-RSVCE-321" class="text Gen-13-2"><sup class="versenum">2&nbsp;</sup>Now Abram was very rich in cattle, in silver, and in gold. </span> <span id="en-RSVCE-322" class="text Gen-13-3"><sup class="versenum">3&nbsp;</sup>And he journeyed on from the Negeb as far as Bethel, to the place where his tent had been at the beginning, between Bethel and Ai, </span> <span id="en-RSVCE-323" class="text Gen-13-4"><sup class="versenum">4&nbsp;</sup>to the place where he had made an altar at the first; and there Abram called on the name of the <span style="font-variant: small-caps" class="small-caps">Lord</span>. </span> <span id="en-RSVCE-324" class="text Gen-13-5"><sup class="versenum">5&nbsp;</sup>And Lot, who went with Abram, also had flocks and herds and tents, </span> <span id="en-RSVCE-325" class="text Gen-13-6"><sup class="versenum">6&nbsp;</sup>so that the land could not support both of them dwelling together; for their possessions were so great that they could not dwell together, </span> <span id="en-RSVCE-326" class="text Gen-13-7"><sup class="versenum">7&nbsp;</sup>and there was strife between the herdsmen of Abram’s cattle and the herdsmen of Lot’s cattle. At that time the Canaanites and the Per′izzites dwelt in the land.</span></p> <p><span id="en-RSVCE-327" class="text Gen-13-8"><sup class="versenum">8&nbsp;</sup>Then Abram said to Lot, “Let there be no strife between you and me, and between your herdsmen and my herdsmen; for we are kinsmen. </span> <span id="en-RSVCE-328" class="text Gen-13-9"><sup class="versenum">9&nbsp;</sup>Is not the whole land before you? Separate yourself from me. If you take the left hand, then I will go to the right; or if you take the right hand, then I will go to the left.” </span> <span id="en-RSVCE-329" class="text Gen-13-10"><sup class="versenum">10&nbsp;</sup>And Lot lifted up his eyes, and saw that the Jordan valley was well watered everywhere like the garden of the <span style="font-variant: small-caps" class="small-caps">Lord</span>, like the land of Egypt, in the direction of Zo′ar; this was before the <span style="font-variant: small-caps" class="small-caps">Lord</span> destroyed Sodom and Gomor′rah. </span> <span id="en-RSVCE-330" class="text Gen-13-11"><sup class="versenum">11&nbsp;</sup>So Lot chose for himself all the Jordan valley, and Lot journeyed east; thus they separated from each other. </span> <span id="en-RSVCE-331" class="text Gen-13-12"><sup class="versenum">12&nbsp;</sup>Abram dwelt in the land of Canaan, while Lot dwelt among the cities of the valley and moved his tent as far as Sodom. </span> <span id="en-RSVCE-332" class="text Gen-13-13"><sup class="versenum">13&nbsp;</sup>Now the men of Sodom were wicked, great sinners against the <span style="font-variant: small-caps" class="small-caps">Lord</span>.</span></p> <p><span id="en-RSVCE-333" class="text Gen-13-14"><sup class="versenum">14&nbsp;</sup>The <span style="font-variant: small-caps" class="small-caps">Lord</span> said to Abram, after Lot had separated from him, “Lift up your eyes, and look from the place where you are, northward and southward and eastward and westward; </span> <span id="en-RSVCE-334" class="text Gen-13-15"><sup class="versenum">15&nbsp;</sup>for all the land which you see I will give to you and to your descendants for ever. </span> <span id="en-RSVCE-335" class="text Gen-13-16"><sup class="versenum">16&nbsp;</sup>I will make your descendants as the dust of the earth; so that if one can count the dust of the earth, your descendants also can be counted. </span> <span id="en-RSVCE-336" class="text Gen-13-17"><sup class="versenum">17&nbsp;</sup>Arise, walk through the length and the breadth of the land, for I will give it to you.” </span> <span id="en-RSVCE-337" class="text Gen-13-18"><sup class="versenum">18&nbsp;</sup>So Abram moved his tent, and came and dwelt by the oaks<sup data-fn="#fen-RSVCE-337d" class="footnote" data-link="[<a href=&quot;#fen-RSVCE-337d&quot; title=&quot;See footnote d&quot;>d</a>]">[<a href="#fen-RSVCE-337d" title="See footnote d">d</a>]</sup> of Mamre, which are at Hebron; and there he built an altar to the <span style="font-variant: small-caps" class="small-caps">Lord</span>.</span></p>  <!--end of footnotes-->\n</p>
</p>
</div>
</div>
<!--[if mso]></td></tr></table><![endif]-->
<!--[if (!mso)&(!IE)]><!-->
</div>
<!--<![endif]-->
</div>
</div>
<!--[if (mso)|(IE)]></td></tr></table><![endif]-->
<!--[if (mso)|(IE)]></td></tr></table></td></tr></table><![endif]-->
</div>
</div>
</div>
<div style="background-color:transparent;">
<div class="block-grid" style="min-width: 320px; max-width: 680px; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; Margin: 0 auto; background-color: transparent;">
<div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
<!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:transparent;"><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:680px"><tr class="layout-full-width" style="background-color:transparent"><![endif]-->
<!--[if (mso)|(IE)]><td align="center" width="680" style="background-color:transparent;width:680px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top:15px; padding-bottom:50px;"><![endif]-->
<div class="col num12" style="min-width: 320px; max-width: 680px; display: table-cell; vertical-align: top; width: 680px;">
<div class="col_cont" style="width:100% !important;">
<!--[if (!mso)&(!IE)]><!-->
<div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:15px; padding-bottom:50px; padding-right: 0px; padding-left: 0px;">
<!--<![endif]-->
<div></div>
<!--[if (!mso)&(!IE)]><!-->
</div>
<!--<![endif]-->
</div>
</div>
<!--[if (mso)|(IE)]></td></tr></table><![endif]-->
<!--[if (mso)|(IE)]></td></tr></table></td></tr></table><![endif]-->
</div>
</div>
</div>
<div style="background-color:#ffffff;">
<div class="block-grid" style="min-width: 320px; max-width: 680px; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; Margin: 0 auto; background-color: transparent;">
<div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
<!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;"><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:680px"><tr class="layout-full-width" style="background-color:transparent"><![endif]-->
<!--[if (mso)|(IE)]><td align="center" width="680" style="background-color:transparent;width:680px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top:40px; padding-bottom:5px;"><![endif]-->
<div class="col num12" style="min-width: 320px; max-width: 680px; display: table-cell; vertical-align: top; width: 680px;">
<div class="col_cont" style="width:100% !important;">
<!--[if (!mso)&(!IE)]><!-->
<div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:40px; padding-bottom:5px; padding-right: 0px; padding-left: 0px;">
<!--<![endif]-->
<!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 10px; padding-left: 10px; padding-top: 10px; padding-bottom: 10px; font-family: Arial, sans-serif"><![endif]-->
<!--[if mso]></td></tr></table><![endif]-->
<!--[if (!mso)&(!IE)]><!-->
</div>
<!--<![endif]-->
</div>
</div>
<!--[if (mso)|(IE)]></td></tr></table><![endif]-->
<!--[if (mso)|(IE)]></td></tr></table></td></tr></table><![endif]-->
</div>
</div>
</div>
<div style="background-color:#ffffff;">
<div class="block-grid" style="min-width: 320px; max-width: 680px; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; Margin: 0 auto; background-color: transparent;">
<div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
<!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;"><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:680px"><tr class="layout-full-width" style="background-color:transparent"><![endif]-->
<!--[if (mso)|(IE)]><td align="center" width="680" style="background-color:transparent;width:680px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top:60px; padding-bottom:30px;"><![endif]-->
<div class="col num12" style="min-width: 320px; max-width: 680px; display: table-cell; vertical-align: top; width: 680px;">
<div class="col_cont" style="width:100% !important;">
<!--[if (!mso)&(!IE)]><!-->
<div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:60px; padding-bottom:30px; padding-right: 0px; padding-left: 0px;">
<!--<![endif]-->
<!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top: 0px; padding-bottom: 0px; font-family: Arial, sans-serif"><![endif]-->
<div style="color:#515c74;font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;line-height:1.2;padding-top:0px;padding-right:0px;padding-bottom:0px;padding-left:0px;">
<div style="line-height: 1.2; font-size: 12px; color: #515c74; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; mso-line-height-alt: 14px;">
<p style="text-align: center; line-height: 1.2; word-break: break-word; font-size: 14px; mso-line-height-alt: 17px; margin: 0;"><span style="font-size: 14px;"><span style="">SECOND READING</span></span></p>
</div>
</div>
<!--[if mso]></td></tr></table><![endif]-->
<!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 10px; padding-left: 10px; padding-top: 0px; padding-bottom: 10px; font-family: Arial, sans-serif"><![endif]-->
<div style="color:#ff5c5c;font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;line-height:1.2;padding-top:0px;padding-right:10px;padding-bottom:10px;padding-left:10px;">
<div style="line-height: 1.2; font-size: 12px; color: #ff5c5c; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; mso-line-height-alt: 14px;">
<p style="text-align: center; line-height: 1.2; word-break: break-word; font-size: 34px; mso-line-height-alt: 41px; margin: 0;"><span style="font-size: 34px;"><strong><span style="">JOB 1-2</span></strong></span></p>
</div>
</div>
<!--[if mso]></td></tr></table><![endif]-->
<!--[if (!mso)&(!IE)]><!-->
</div>
<!--<![endif]-->
</div>
</div>
<!--[if (mso)|(IE)]></td></tr></table><![endif]-->
<!--[if (mso)|(IE)]></td></tr></table></td></tr></table><![endif]-->
</div>
</div>
</div>
<div style="background-color:#ffffff;">
<div class="block-grid" style="min-width: 320px; max-width: 680px; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; Margin: 0 auto; background-color: transparent;">
<div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
<!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;"><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:680px"><tr class="layout-full-width" style="background-color:transparent"><![endif]-->
<!--[if (mso)|(IE)]><td align="center" width="680" style="background-color:transparent;width:680px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 10px; padding-left: 10px; padding-top:5px; padding-bottom:30px;"><![endif]-->
<div class="col num12" style="min-width: 320px; max-width: 680px; display: table-cell; vertical-align: top; width: 680px;">
<div class="col_cont" style="width:100% !important;">
<!--[if (!mso)&(!IE)]><!-->
<div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:5px; padding-bottom:30px; padding-right: 10px; padding-left: 10px;">
<!--<![endif]-->
<!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 10px; padding-left: 10px; padding-top: 10px; padding-bottom: 10px; font-family: Arial, sans-serif"><![endif]-->
<div style="color:#515c74;font-family:Helvetica Neue, Helvetica, Arial, sans-serif;line-height:1.5;padding-top:10px;padding-right:10px;padding-bottom:10px;padding-left:10px;">
<div style="line-height: 1.5; font-size: 12px; color: #515c74; font-family: Helvetica Neue, Helvetica, Arial, sans-serif; mso-line-height-alt: 18px;">
<p style="line-height: 1.5; word-break: break-word; text-align: left; font-size: 15px; mso-line-height-alt: 23px; margin: 0;">
<p style="font-size: 14px; line-height: 1.2; mso-line-height-alt: 17px; margin: 0;">\n <h3><span id="en-RSVCE-300\" class="text Gen-12-1\">The Call of Abram</span></h3><p class="chapter-2"><span class="text Gen-12-1"><span class="chapternum">12&nbsp;</span><sup data-fn="#fen-RSVCE-300a" class="footnote" data-link="[<a href=&quot;#fen-RSVCE-300a&quot; title=&quot;See footnote a&quot;>a</a>]">[<a href="#fen-RSVCE-300a" title="See footnote a">a</a>]</sup>Now the <span style="font-variant: small-caps" class="small-caps">Lord</span> said to Abram, “Go from your country and your kindred and your father’s house to the land that I will show you. </span> <span id="en-RSVCE-301" class="text Gen-12-2"><sup class="versenum">2&nbsp;</sup>And I will make of you a great nation, and I will bless you, and make your name great, so that you will be a blessing. </span> <span id="en-RSVCE-302" class="text Gen-12-3"><sup class="versenum">3&nbsp;</sup>I will bless those who bless you, and him who curses you I will curse; and by you all the families of the earth shall bless themselves.”<sup data-fn="#fen-RSVCE-302b" class="footnote" data-link="[<a href=&quot;#fen-RSVCE-302b&quot; title=&quot;See footnote b&quot;>b</a>]">[<a href="#fen-RSVCE-302b" title="See footnote b">b</a>]</sup></span></p> <p><span id="en-RSVCE-303" class="text Gen-12-4"><sup class="versenum">4&nbsp;</sup>So Abram went, as the <span style="font-variant: small-caps" class="small-caps">Lord</span> had told him; and Lot went with him. Abram was seventy-five years old when he departed from Haran. </span> <span id="en-RSVCE-304" class="text Gen-12-5"><sup class="versenum">5&nbsp;</sup>And Abram took Sar′ai his wife, and Lot his brother’s son, and all their possessions which they had gathered, and the persons that they had gotten in Haran; and they set forth to go to the land of Canaan. When they had come to the land of Canaan, </span> <span id="en-RSVCE-305" class="text Gen-12-6"><sup class="versenum">6&nbsp;</sup>Abram passed through the land to the place at Shechem, to the oak<sup data-fn="#fen-RSVCE-305c" class="footnote" data-link="[<a href=&quot;#fen-RSVCE-305c&quot; title=&quot;See footnote c&quot;>c</a>]">[<a href="#fen-RSVCE-305c" title="See footnote c">c</a>]</sup> of Moreh. At that time the Canaanites were in the land. </span> <span id="en-RSVCE-306" class="text Gen-12-7"><sup class="versenum">7&nbsp;</sup>Then the <span style="font-variant: small-caps" class="small-caps">Lord</span> appeared to Abram, and said, “To your descendants I will give this land.” So he built there an altar to the <span style="font-variant: small-caps" class="small-caps">Lord</span>, who had appeared to him. </span> <span id="en-RSVCE-307" class="text Gen-12-8"><sup class="versenum">8&nbsp;</sup>Thence he removed to the mountain on the east of Bethel, and pitched his tent, with Bethel on the west and Ai on the east; and there he built an altar to the <span style="font-variant: small-caps" class="small-caps">Lord</span> and called on the name of the <span style="font-variant: small-caps" class="small-caps">Lord</span>. </span> <span id="en-RSVCE-308" class="text Gen-12-9"><sup class="versenum">9&nbsp;</sup>And Abram journeyed on, still going toward the Negeb.</span></p> <h3><span id="en-RSVCE-309" class="text Gen-12-10">Abram and Sarai in Egypt</span></h3><p><span class="text Gen-12-10"><sup class="versenum">10&nbsp;</sup>Now there was a famine in the land. So Abram went down to Egypt to sojourn there, for the famine was severe in the land. </span> <span id="en-RSVCE-310" class="text Gen-12-11"><sup class="versenum">11&nbsp;</sup>When he was about to enter Egypt, he said to Sar′ai his wife, “I know that you are a woman beautiful to behold; </span> <span id="en-RSVCE-311" class="text Gen-12-12"><sup class="versenum">12&nbsp;</sup>and when the Egyptians see you, they will say, ‘This is his wife’; then they will kill me, but they will let you live. </span> <span id="en-RSVCE-312" class="text Gen-12-13"><sup class="versenum">13&nbsp;</sup>Say you are my sister, that it may go well with me because of you, and that my life may be spared on your account.” </span> <span id="en-RSVCE-313" class="text Gen-12-14"><sup class="versenum">14&nbsp;</sup>When Abram entered Egypt the Egyptians saw that the woman was very beautiful. </span> <span id="en-RSVCE-314" class="text Gen-12-15"><sup class="versenum">15&nbsp;</sup>And when the princes of Pharaoh saw her, they praised her to Pharaoh. And the woman was taken into Pharaoh’s house. </span> <span id="en-RSVCE-315" class="text Gen-12-16"><sup class="versenum">16&nbsp;</sup>And for her sake he dealt well with Abram; and he had sheep, oxen, he-asses, menservants, maidservants, she-asses, and camels.</span></p> <p><span id="en-RSVCE-316" class="text Gen-12-17"><sup class="versenum">17&nbsp;</sup>But the <span style="font-variant: small-caps" class="small-caps">Lord</span> afflicted Pharaoh and his house with great plagues because of Sar′ai, Abram’s wife. </span> <span id="en-RSVCE-317" class="text Gen-12-18"><sup class="versenum">18&nbsp;</sup>So Pharaoh called Abram, and said, “What is this you have done to me? Why did you not tell me that she was your wife? </span> <span id="en-RSVCE-318" class="text Gen-12-19"><sup class="versenum">19&nbsp;</sup>Why did you say, ‘She is my sister,’ so that I took her for my wife? Now then, here is your wife, take her, and be gone.” </span> <span id="en-RSVCE-319" class="text Gen-12-20"><sup class="versenum">20&nbsp;</sup>And Pharaoh gave men orders concerning him; and they set him on the way, with his wife and all that he had.</span></p> <h3><span id="en-RSVCE-320" class="text Gen-13-1">Abram and Lot Separate</span></h3><p class="chapter-2"><span class="text Gen-13-1"><span class="chapternum">13&nbsp;</span>So Abram went up from Egypt, he and his wife, and all that he had, and Lot with him, into the Negeb.</span></p> <p><span id="en-RSVCE-321" class="text Gen-13-2"><sup class="versenum">2&nbsp;</sup>Now Abram was very rich in cattle, in silver, and in gold. </span> <span id="en-RSVCE-322" class="text Gen-13-3"><sup class="versenum">3&nbsp;</sup>And he journeyed on from the Negeb as far as Bethel, to the place where his tent had been at the beginning, between Bethel and Ai, </span> <span id="en-RSVCE-323" class="text Gen-13-4"><sup class="versenum">4&nbsp;</sup>to the place where he had made an altar at the first; and there Abram called on the name of the <span style="font-variant: small-caps" class="small-caps">Lord</span>. </span> <span id="en-RSVCE-324" class="text Gen-13-5"><sup class="versenum">5&nbsp;</sup>And Lot, who went with Abram, also had flocks and herds and tents, </span> <span id="en-RSVCE-325" class="text Gen-13-6"><sup class="versenum">6&nbsp;</sup>so that the land could not support both of them dwelling together; for their possessions were so great that they could not dwell together, </span> <span id="en-RSVCE-326" class="text Gen-13-7"><sup class="versenum">7&nbsp;</sup>and there was strife between the herdsmen of Abram’s cattle and the herdsmen of Lot’s cattle. At that time the Canaanites and the Per′izzites dwelt in the land.</span></p> <p><span id="en-RSVCE-327" class="text Gen-13-8"><sup class="versenum">8&nbsp;</sup>Then Abram said to Lot, “Let there be no strife between you and me, and between your herdsmen and my herdsmen; for we are kinsmen. </span> <span id="en-RSVCE-328" class="text Gen-13-9"><sup class="versenum">9&nbsp;</sup>Is not the whole land before you? Separate yourself from me. If you take the left hand, then I will go to the right; or if you take the right hand, then I will go to the left.” </span> <span id="en-RSVCE-329" class="text Gen-13-10"><sup class="versenum">10&nbsp;</sup>And Lot lifted up his eyes, and saw that the Jordan valley was well watered everywhere like the garden of the <span style="font-variant: small-caps" class="small-caps">Lord</span>, like the land of Egypt, in the direction of Zo′ar; this was before the <span style="font-variant: small-caps" class="small-caps">Lord</span> destroyed Sodom and Gomor′rah. </span> <span id="en-RSVCE-330" class="text Gen-13-11"><sup class="versenum">11&nbsp;</sup>So Lot chose for himself all the Jordan valley, and Lot journeyed east; thus they separated from each other. </span> <span id="en-RSVCE-331" class="text Gen-13-12"><sup class="versenum">12&nbsp;</sup>Abram dwelt in the land of Canaan, while Lot dwelt among the cities of the valley and moved his tent as far as Sodom. </span> <span id="en-RSVCE-332" class="text Gen-13-13"><sup class="versenum">13&nbsp;</sup>Now the men of Sodom were wicked, great sinners against the <span style="font-variant: small-caps" class="small-caps">Lord</span>.</span></p> <p><span id="en-RSVCE-333" class="text Gen-13-14"><sup class="versenum">14&nbsp;</sup>The <span style="font-variant: small-caps" class="small-caps">Lord</span> said to Abram, after Lot had separated from him, “Lift up your eyes, and look from the place where you are, northward and southward and eastward and westward; </span> <span id="en-RSVCE-334" class="text Gen-13-15"><sup class="versenum">15&nbsp;</sup>for all the land which you see I will give to you and to your descendants for ever. </span> <span id="en-RSVCE-335" class="text Gen-13-16"><sup class="versenum">16&nbsp;</sup>I will make your descendants as the dust of the earth; so that if one can count the dust of the earth, your descendants also can be counted. </span> <span id="en-RSVCE-336" class="text Gen-13-17"><sup class="versenum">17&nbsp;</sup>Arise, walk through the length and the breadth of the land, for I will give it to you.” </span> <span id="en-RSVCE-337" class="text Gen-13-18"><sup class="versenum">18&nbsp;</sup>So Abram moved his tent, and came and dwelt by the oaks<sup data-fn="#fen-RSVCE-337d" class="footnote" data-link="[<a href=&quot;#fen-RSVCE-337d&quot; title=&quot;See footnote d&quot;>d</a>]">[<a href="#fen-RSVCE-337d" title="See footnote d">d</a>]</sup> of Mamre, which are at Hebron; and there he built an altar to the <span style="font-variant: small-caps" class="small-caps">Lord</span>.</span></p>  <!--end of footnotes-->\n</p>
</p>
</div>
</div>
<!--[if mso]></td></tr></table><![endif]-->
<!--[if (!mso)&(!IE)]><!-->
</div>
<!--<![endif]-->
</div>
</div>
<!--[if (mso)|(IE)]></td></tr></table><![endif]-->
<!--[if (mso)|(IE)]></td></tr></table></td></tr></table><![endif]-->
</div>
</div>
</div>
<div style="background-color:#ffffff;">
<div class="block-grid" style="min-width: 320px; max-width: 680px; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; Margin: 0 auto; background-color: transparent;">
<div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
<!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;"><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:680px"><tr class="layout-full-width" style="background-color:transparent"><![endif]-->
<!--[if (mso)|(IE)]><td align="center" width="680" style="background-color:transparent;width:680px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top:40px; padding-bottom:15px;"><![endif]-->
<div class="col num12" style="min-width: 320px; max-width: 680px; display: table-cell; vertical-align: top; width: 680px;">
<div class="col_cont" style="width:100% !important;">
<!--[if (!mso)&(!IE)]><!-->
<div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:40px; padding-bottom:15px; padding-right: 0px; padding-left: 0px;">
<!--<![endif]-->
<!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 10px; padding-left: 10px; padding-top: 10px; padding-bottom: 10px; font-family: Arial, sans-serif"><![endif]-->
<!--[if mso]></td></tr></table><![endif]-->
<!--[if (!mso)&(!IE)]><!-->
</div>
<!--<![endif]-->
</div>
</div>
<!--[if (mso)|(IE)]></td></tr></table><![endif]-->
<!--[if (mso)|(IE)]></td></tr></table></td></tr></table><![endif]-->
</div>
</div>
</div>
<div style="background-color:transparent;">
<div class="block-grid" style="min-width: 320px; max-width: 680px; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; Margin: 0 auto; background-color: transparent;">
<div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
<!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:transparent;"><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:680px"><tr class="layout-full-width" style="background-color:transparent"><![endif]-->
<!--[if (mso)|(IE)]><td align="center" width="680" style="background-color:transparent;width:680px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top:40px; padding-bottom:5px;"><![endif]-->
<div class="col num12" style="min-width: 320px; max-width: 680px; display: table-cell; vertical-align: top; width: 680px;">
<div class="col_cont" style="width:100% !important;">
<!--[if (!mso)&(!IE)]><!-->
<div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:40px; padding-bottom:5px; padding-right: 0px; padding-left: 0px;">
<!--<![endif]-->
<!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 10px; padding-left: 10px; padding-top: 10px; padding-bottom: 10px; font-family: Arial, sans-serif"><![endif]-->
<!--[if mso]></td></tr></table><![endif]-->
<!--[if (!mso)&(!IE)]><!-->
</div>
<!--<![endif]-->
</div>
</div>
<!--[if (mso)|(IE)]></td></tr></table><![endif]-->
<!--[if (mso)|(IE)]></td></tr></table></td></tr></table><![endif]-->
</div>
</div>
</div>
<div style="background-color:transparent;">
<div class="block-grid" style="min-width: 320px; max-width: 680px; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; Margin: 0 auto; background-color: transparent;">
<div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
<!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:transparent;"><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:680px"><tr class="layout-full-width" style="background-color:transparent"><![endif]-->
<!--[if (mso)|(IE)]><td align="center" width="680" style="background-color:transparent;width:680px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top:60px; padding-bottom:30px;"><![endif]-->
<div class="col num12" style="min-width: 320px; max-width: 680px; display: table-cell; vertical-align: top; width: 680px;">
<div class="col_cont" style="width:100% !important;">
<!--[if (!mso)&(!IE)]><!-->
<div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:60px; padding-bottom:30px; padding-right: 0px; padding-left: 0px;">
<!--<![endif]-->
<!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top: 0px; padding-bottom: 0px; font-family: Arial, sans-serif"><![endif]-->
<div style="color:#515c74;font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;line-height:1.2;padding-top:0px;padding-right:0px;padding-bottom:0px;padding-left:0px;">
<div style="line-height: 1.2; font-size: 12px; color: #515c74; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; mso-line-height-alt: 14px;">
<p style="text-align: center; line-height: 1.2; word-break: break-word; font-size: 14px; mso-line-height-alt: 17px; margin: 0;"><span style="font-size: 14px;"><span style="">PSALM / PROVERBS</span></span></p>
</div>
</div>
<!--[if mso]></td></tr></table><![endif]-->
<!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 10px; padding-left: 10px; padding-top: 10px; padding-bottom: 10px; font-family: Arial, sans-serif"><![endif]-->
<div style="color:#ff5c5c;font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;line-height:1.2;padding-top:10px;padding-right:10px;padding-bottom:10px;padding-left:10px;">
<div style="line-height: 1.2; font-size: 12px; color: #ff5c5c; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; mso-line-height-alt: 14px;">
<p style="text-align: center; line-height: 1.2; word-break: break-word; font-size: 34px; mso-line-height-alt: 41px; margin: 0;"><span style="font-size: 34px;"><strong><span style="">Proverbs 1:8-19</span></strong></span></p>
</div>
</div>
<!--[if mso]></td></tr></table><![endif]-->
<!--[if (!mso)&(!IE)]><!-->
</div>
<!--<![endif]-->
</div>
</div>
<!--[if (mso)|(IE)]></td></tr></table><![endif]-->
<!--[if (mso)|(IE)]></td></tr></table></td></tr></table><![endif]-->
</div>
</div>
</div>
<div style="background-color:transparent;">
<div class="block-grid" style="min-width: 320px; max-width: 680px; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; Margin: 0 auto; background-color: transparent;">
<div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
<!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:transparent;"><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:680px"><tr class="layout-full-width" style="background-color:transparent"><![endif]-->
<!--[if (mso)|(IE)]><td align="center" width="680" style="background-color:transparent;width:680px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top:5px; padding-bottom:5px;"><![endif]-->
<div class="col num12" style="min-width: 320px; max-width: 680px; display: table-cell; vertical-align: top; width: 680px;">
<div class="col_cont" style="width:100% !important;">
<!--[if (!mso)&(!IE)]><!-->
<div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:5px; padding-bottom:5px; padding-right: 0px; padding-left: 0px;">
<!--<![endif]-->
<!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 10px; padding-left: 10px; padding-top: 10px; padding-bottom: 10px; font-family: Arial, sans-serif"><![endif]-->
<div style="color:#515c74;font-family:Helvetica Neue, Helvetica, Arial, sans-serif;line-height:1.5;padding-top:10px;padding-right:10px;padding-bottom:10px;padding-left:10px;">
<div style="line-height: 1.5; font-size: 12px; color: #515c74; font-family: Helvetica Neue, Helvetica, Arial, sans-serif; mso-line-height-alt: 18px;">
<p style="line-height: 1.5; word-break: break-word; text-align: left; font-size: 15px; mso-line-height-alt: 23px; margin: 0;">
<p style="font-size: 14px; line-height: 1.2; mso-line-height-alt: 17px; margin: 0;">\n <h3><span id="en-RSVCE-300\" class="text Gen-12-1\">The Call of Abram</span></h3><p class="chapter-2"><span class="text Gen-12-1"><span class="chapternum">12&nbsp;</span><sup data-fn="#fen-RSVCE-300a" class="footnote" data-link="[<a href=&quot;#fen-RSVCE-300a&quot; title=&quot;See footnote a&quot;>a</a>]">[<a href="#fen-RSVCE-300a" title="See footnote a">a</a>]</sup>Now the <span style="font-variant: small-caps" class="small-caps">Lord</span> said to Abram, “Go from your country and your kindred and your father’s house to the land that I will show you. </span> <span id="en-RSVCE-301" class="text Gen-12-2"><sup class="versenum">2&nbsp;</sup>And I will make of you a great nation, and I will bless you, and make your name great, so that you will be a blessing. </span> <span id="en-RSVCE-302" class="text Gen-12-3"><sup class="versenum">3&nbsp;</sup>I will bless those who bless you, and him who curses you I will curse; and by you all the families of the earth shall bless themselves.”<sup data-fn="#fen-RSVCE-302b" class="footnote" data-link="[<a href=&quot;#fen-RSVCE-302b&quot; title=&quot;See footnote b&quot;>b</a>]">[<a href="#fen-RSVCE-302b" title="See footnote b">b</a>]</sup></span></p> <p><span id="en-RSVCE-303" class="text Gen-12-4"><sup class="versenum">4&nbsp;</sup>So Abram went, as the <span style="font-variant: small-caps" class="small-caps">Lord</span> had told him; and Lot went with him. Abram was seventy-five years old when he departed from Haran. </span> <span id="en-RSVCE-304" class="text Gen-12-5"><sup class="versenum">5&nbsp;</sup>And Abram took Sar′ai his wife, and Lot his brother’s son, and all their possessions which they had gathered, and the persons that they had gotten in Haran; and they set forth to go to the land of Canaan. When they had come to the land of Canaan, </span> <span id="en-RSVCE-305" class="text Gen-12-6"><sup class="versenum">6&nbsp;</sup>Abram passed through the land to the place at Shechem, to the oak<sup data-fn="#fen-RSVCE-305c" class="footnote" data-link="[<a href=&quot;#fen-RSVCE-305c&quot; title=&quot;See footnote c&quot;>c</a>]">[<a href="#fen-RSVCE-305c" title="See footnote c">c</a>]</sup> of Moreh. At that time the Canaanites were in the land. </span> <span id="en-RSVCE-306" class="text Gen-12-7"><sup class="versenum">7&nbsp;</sup>Then the <span style="font-variant: small-caps" class="small-caps">Lord</span> appeared to Abram, and said, “To your descendants I will give this land.” So he built there an altar to the <span style="font-variant: small-caps" class="small-caps">Lord</span>, who had appeared to him. </span> <span id="en-RSVCE-307" class="text Gen-12-8"><sup class="versenum">8&nbsp;</sup>Thence he removed to the mountain on the east of Bethel, and pitched his tent, with Bethel on the west and Ai on the east; and there he built an altar to the <span style="font-variant: small-caps" class="small-caps">Lord</span> and called on the name of the <span style="font-variant: small-caps" class="small-caps">Lord</span>. </span> <span id="en-RSVCE-308" class="text Gen-12-9"><sup class="versenum">9&nbsp;</sup>And Abram journeyed on, still going toward the Negeb.</span></p> <h3><span id="en-RSVCE-309" class="text Gen-12-10">Abram and Sarai in Egypt</span></h3><p><span class="text Gen-12-10"><sup class="versenum">10&nbsp;</sup>Now there was a famine in the land. So Abram went down to Egypt to sojourn there, for the famine was severe in the land. </span> <span id="en-RSVCE-310" class="text Gen-12-11"><sup class="versenum">11&nbsp;</sup>When he was about to enter Egypt, he said to Sar′ai his wife, “I know that you are a woman beautiful to behold; </span> <span id="en-RSVCE-311" class="text Gen-12-12"><sup class="versenum">12&nbsp;</sup>and when the Egyptians see you, they will say, ‘This is his wife’; then they will kill me, but they will let you live. </span> <span id="en-RSVCE-312" class="text Gen-12-13"><sup class="versenum">13&nbsp;</sup>Say you are my sister, that it may go well with me because of you, and that my life may be spared on your account.” </span> <span id="en-RSVCE-313" class="text Gen-12-14"><sup class="versenum">14&nbsp;</sup>When Abram entered Egypt the Egyptians saw that the woman was very beautiful. </span> <span id="en-RSVCE-314" class="text Gen-12-15"><sup class="versenum">15&nbsp;</sup>And when the princes of Pharaoh saw her, they praised her to Pharaoh. And the woman was taken into Pharaoh’s house. </span> <span id="en-RSVCE-315" class="text Gen-12-16"><sup class="versenum">16&nbsp;</sup>And for her sake he dealt well with Abram; and he had sheep, oxen, he-asses, menservants, maidservants, she-asses, and camels.</span></p> <p><span id="en-RSVCE-316" class="text Gen-12-17"><sup class="versenum">17&nbsp;</sup>But the <span style="font-variant: small-caps" class="small-caps">Lord</span> afflicted Pharaoh and his house with great plagues because of Sar′ai, Abram’s wife. </span> <span id="en-RSVCE-317" class="text Gen-12-18"><sup class="versenum">18&nbsp;</sup>So Pharaoh called Abram, and said, “What is this you have done to me? Why did you not tell me that she was your wife? </span> <span id="en-RSVCE-318" class="text Gen-12-19"><sup class="versenum">19&nbsp;</sup>Why did you say, ‘She is my sister,’ so that I took her for my wife? Now then, here is your wife, take her, and be gone.” </span> <span id="en-RSVCE-319" class="text Gen-12-20"><sup class="versenum">20&nbsp;</sup>And Pharaoh gave men orders concerning him; and they set him on the way, with his wife and all that he had.</span></p> <h3><span id="en-RSVCE-320" class="text Gen-13-1">Abram and Lot Separate</span></h3><p class="chapter-2"><span class="text Gen-13-1"><span class="chapternum">13&nbsp;</span>So Abram went up from Egypt, he and his wife, and all that he had, and Lot with him, into the Negeb.</span></p> <p><span id="en-RSVCE-321" class="text Gen-13-2"><sup class="versenum">2&nbsp;</sup>Now Abram was very rich in cattle, in silver, and in gold. </span> <span id="en-RSVCE-322" class="text Gen-13-3"><sup class="versenum">3&nbsp;</sup>And he journeyed on from the Negeb as far as Bethel, to the place where his tent had been at the beginning, between Bethel and Ai, </span> <span id="en-RSVCE-323" class="text Gen-13-4"><sup class="versenum">4&nbsp;</sup>to the place where he had made an altar at the first; and there Abram called on the name of the <span style="font-variant: small-caps" class="small-caps">Lord</span>. </span> <span id="en-RSVCE-324" class="text Gen-13-5"><sup class="versenum">5&nbsp;</sup>And Lot, who went with Abram, also had flocks and herds and tents, </span> <span id="en-RSVCE-325" class="text Gen-13-6"><sup class="versenum">6&nbsp;</sup>so that the land could not support both of them dwelling together; for their possessions were so great that they could not dwell together, </span> <span id="en-RSVCE-326" class="text Gen-13-7"><sup class="versenum">7&nbsp;</sup>and there was strife between the herdsmen of Abram’s cattle and the herdsmen of Lot’s cattle. At that time the Canaanites and the Per′izzites dwelt in the land.</span></p> <p><span id="en-RSVCE-327" class="text Gen-13-8"><sup class="versenum">8&nbsp;</sup>Then Abram said to Lot, “Let there be no strife between you and me, and between your herdsmen and my herdsmen; for we are kinsmen. </span> <span id="en-RSVCE-328" class="text Gen-13-9"><sup class="versenum">9&nbsp;</sup>Is not the whole land before you? Separate yourself from me. If you take the left hand, then I will go to the right; or if you take the right hand, then I will go to the left.” </span> <span id="en-RSVCE-329" class="text Gen-13-10"><sup class="versenum">10&nbsp;</sup>And Lot lifted up his eyes, and saw that the Jordan valley was well watered everywhere like the garden of the <span style="font-variant: small-caps" class="small-caps">Lord</span>, like the land of Egypt, in the direction of Zo′ar; this was before the <span style="font-variant: small-caps" class="small-caps">Lord</span> destroyed Sodom and Gomor′rah. </span> <span id="en-RSVCE-330" class="text Gen-13-11"><sup class="versenum">11&nbsp;</sup>So Lot chose for himself all the Jordan valley, and Lot journeyed east; thus they separated from each other. </span> <span id="en-RSVCE-331" class="text Gen-13-12"><sup class="versenum">12&nbsp;</sup>Abram dwelt in the land of Canaan, while Lot dwelt among the cities of the valley and moved his tent as far as Sodom. </span> <span id="en-RSVCE-332" class="text Gen-13-13"><sup class="versenum">13&nbsp;</sup>Now the men of Sodom were wicked, great sinners against the <span style="font-variant: small-caps" class="small-caps">Lord</span>.</span></p> <p><span id="en-RSVCE-333" class="text Gen-13-14"><sup class="versenum">14&nbsp;</sup>The <span style="font-variant: small-caps" class="small-caps">Lord</span> said to Abram, after Lot had separated from him, “Lift up your eyes, and look from the place where you are, northward and southward and eastward and westward; </span> <span id="en-RSVCE-334" class="text Gen-13-15"><sup class="versenum">15&nbsp;</sup>for all the land which you see I will give to you and to your descendants for ever. </span> <span id="en-RSVCE-335" class="text Gen-13-16"><sup class="versenum">16&nbsp;</sup>I will make your descendants as the dust of the earth; so that if one can count the dust of the earth, your descendants also can be counted. </span> <span id="en-RSVCE-336" class="text Gen-13-17"><sup class="versenum">17&nbsp;</sup>Arise, walk through the length and the breadth of the land, for I will give it to you.” </span> <span id="en-RSVCE-337" class="text Gen-13-18"><sup class="versenum">18&nbsp;</sup>So Abram moved his tent, and came and dwelt by the oaks<sup data-fn="#fen-RSVCE-337d" class="footnote" data-link="[<a href=&quot;#fen-RSVCE-337d&quot; title=&quot;See footnote d&quot;>d</a>]">[<a href="#fen-RSVCE-337d" title="See footnote d">d</a>]</sup> of Mamre, which are at Hebron; and there he built an altar to the <span style="font-variant: small-caps" class="small-caps">Lord</span>.</span></p>  <!--end of footnotes-->\n</p>
</p>
</div>
</div>
<!--[if mso]></td></tr></table><![endif]-->
<!--[if (!mso)&(!IE)]><!-->
</div>
<!--<![endif]-->
</div>
</div>
<!--[if (mso)|(IE)]></td></tr></table><![endif]-->
<!--[if (mso)|(IE)]></td></tr></table></td></tr></table><![endif]-->
</div>
</div>
</div>
<div style="background-color:transparent;">
<div class="block-grid" style="min-width: 320px; max-width: 680px; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; Margin: 0 auto; background-color: transparent;">
<div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
<!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:transparent;"><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:680px"><tr class="layout-full-width" style="background-color:transparent"><![endif]-->
<!--[if (mso)|(IE)]><td align="center" width="680" style="background-color:transparent;width:680px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top:15px; padding-bottom:50px;"><![endif]-->
<div class="col num12" style="min-width: 320px; max-width: 680px; display: table-cell; vertical-align: top; width: 680px;">
<div class="col_cont" style="width:100% !important;">
<!--[if (!mso)&(!IE)]><!-->
<div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:15px; padding-bottom:50px; padding-right: 0px; padding-left: 0px;">
<!--<![endif]-->
<div></div>
<!--[if (!mso)&(!IE)]><!-->
</div>
<!--<![endif]-->
</div>
</div>
<!--[if (mso)|(IE)]></td></tr></table><![endif]-->
<!--[if (mso)|(IE)]></td></tr></table></td></tr></table><![endif]-->
</div>
</div>
</div>
<div style="background-image:url('https://i.imgur.com/sH4PE1M.png');background-position:center top;background-repeat:no-repeat;background-color:#ff5c5c;">
<div class="block-grid" style="min-width: 320px; max-width: 680px; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; Margin: 0 auto; background-color: transparent;">
<div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
<!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-image:url('https://i.imgur.com/sH4PE1M.png');background-position:center top;background-repeat:no-repeat;background-color:#ff5c5c;"><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:680px"><tr class="layout-full-width" style="background-color:transparent"><![endif]-->
<!--[if (mso)|(IE)]><td align="center" width="680" style="background-color:transparent;width:680px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top:60px; padding-bottom:60px;"><![endif]-->
<div class="col num12" style="min-width: 320px; max-width: 680px; display: table-cell; vertical-align: top; width: 680px;">
<div class="col_cont" style="width:100% !important;">
<!--[if (!mso)&(!IE)]><!-->
<div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:60px; padding-bottom:60px; padding-right: 0px; padding-left: 0px;">
<!--<![endif]-->
<!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 10px; padding-left: 10px; padding-top: 10px; padding-bottom: 10px; font-family: Arial, sans-serif"><![endif]-->
<div style="color:#e6eef8;font-family:Helvetica Neue, Helvetica, Arial, sans-serif;line-height:1.2;padding-top:10px;padding-right:10px;padding-bottom:10px;padding-left:10px;">
<div style="line-height: 1.2; font-size: 12px; color: #e6eef8; font-family: Helvetica Neue, Helvetica, Arial, sans-serif; mso-line-height-alt: 14px;">
<p style="font-size: 30px; line-height: 1.2; word-break: break-word; text-align: center; mso-line-height-alt: 36px; margin: 0;"><span style="font-size: 30px;">Thank you for joining us on this journey!</span></p>
</div>
</div>
<!--[if mso]></td></tr></table><![endif]-->
<!--[if (!mso)&(!IE)]><!-->
</div>
<!--<![endif]-->
</div>
</div>
<!--[if (mso)|(IE)]></td></tr></table><![endif]-->
<!--[if (mso)|(IE)]></td></tr></table></td></tr></table><![endif]-->
</div>
</div>
</div>
<div style="background-color:#ffffff;">
<div class="block-grid three-up" style="min-width: 320px; max-width: 680px; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; Margin: 0 auto; background-color: transparent;">
<div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
<!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;"><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:680px"><tr class="layout-full-width" style="background-color:transparent"><![endif]-->
<!--[if (mso)|(IE)]><td align="center" width="170" style="background-color:transparent;width:170px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top:25px; padding-bottom:0px;"><![endif]-->
<div class="col num3" style="display: table-cell; vertical-align: top; max-width: 320px; min-width: 168px; width: 170px;">
<div class="col_cont" style="width:100% !important;">
<!--[if (!mso)&(!IE)]><!-->
<div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:25px; padding-bottom:0px; padding-right: 0px; padding-left: 0px;">
<!--<![endif]-->
<!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top: 15px; padding-bottom: 0px; font-family: Arial, sans-serif"><![endif]-->
<div style="color:#555555;font-family:Helvetica Neue, Helvetica, Arial, sans-serif;line-height:1.2;padding-top:15px;padding-right:0px;padding-bottom:0px;padding-left:0px;">
<div style="line-height: 1.2; font-size: 12px; color: #555555; font-family: Helvetica Neue, Helvetica, Arial, sans-serif; mso-line-height-alt: 14px;">
<p style="font-size: 20px; line-height: 1.2; word-break: break-word; text-align: center; mso-line-height-alt: 24px; margin: 0;"><span style="font-size: 20px;"><strong>Anup Macwan</strong></span></p>
</div>
</div>
<!--[if mso]></td></tr></table><![endif]-->
<!--[if (!mso)&(!IE)]><!-->
</div>
<!--<![endif]-->
</div>
</div>
<!--[if (mso)|(IE)]></td></tr></table><![endif]-->
<!--[if (mso)|(IE)]></td><td align="center" width="340" style="background-color:transparent;width:340px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top:30px; padding-bottom:10px;"><![endif]-->
<div class="col num6" style="display: table-cell; vertical-align: top; max-width: 320px; min-width: 336px; width: 340px;">
<div class="col_cont" style="width:100% !important;">
<!--[if (!mso)&(!IE)]><!-->
<div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:30px; padding-bottom:10px; padding-right: 0px; padding-left: 0px;">
<!--<![endif]-->
<!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 10px; padding-left: 10px; padding-top: 10px; padding-bottom: 10px; font-family: Arial, sans-serif"><![endif]-->
<div style="color:#515c74;font-family:Helvetica Neue, Helvetica, Arial, sans-serif;line-height:1.2;padding-top:10px;padding-right:10px;padding-bottom:10px;padding-left:10px;">
<div style="line-height: 1.2; font-size: 12px; font-family: Helvetica Neue, Helvetica, Arial, sans-serif; color: #515c74; mso-line-height-alt: 14px;">
<p style="line-height: 1.2; word-break: break-word; text-align: center; font-family: Helvetica Neue, Helvetica, Arial, sans-serif; mso-line-height-alt: 14px; margin: 0;"><span style="">4109 Palmer Park Circle E, New Albany, OH 43054</span></p>
<p style="line-height: 1.2; word-break: break-word; text-align: center; font-family: Helvetica Neue, Helvetica, Arial, sans-serif; mso-line-height-alt: 14px; margin: 0;"><span style="">anupmac6@gmail.com   |  (+1) 702 820 9514</span></p>
<p style="line-height: 1.2; word-break: break-word; text-align: center; font-family: Helvetica Neue, Helvetica, Arial, sans-serif; mso-line-height-alt: 14px; margin: 0;"> </p>
<p style="line-height: 1.2; word-break: break-word; text-align: center; font-family: Helvetica Neue, Helvetica, Arial, sans-serif; mso-line-height-alt: 14px; margin: 0;"><span style="">2021 © All Rights Reserved</span></p>
</div>
</div>
<!--[if mso]></td></tr></table><![endif]-->
<!--[if (!mso)&(!IE)]><!-->
</div>
<!--<![endif]-->
</div>
</div>
<!--[if (mso)|(IE)]></td></tr></table><![endif]-->
<!--[if (mso)|(IE)]></td><td align="center" width="170" style="background-color:transparent;width:170px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top:30px; padding-bottom:5px;"><![endif]-->
<div class="col num3" style="display: table-cell; vertical-align: top; max-width: 320px; min-width: 168px; width: 170px;">
<div class="col_cont" style="width:100% !important;">
<!--[if (!mso)&(!IE)]><!-->
<div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:30px; padding-bottom:5px; padding-right: 0px; padding-left: 0px;">
<!--<![endif]-->
<table cellpadding="0" cellspacing="0" class="social_icons" role="presentation" style="table-layout: fixed; vertical-align: top; border-spacing: 0; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;" valign="top" width="100%">
<tbody>
<tr style="vertical-align: top;" valign="top">
<td style="word-break: break-word; vertical-align: top; padding-top: 10px; padding-right: 10px; padding-bottom: 10px; padding-left: 10px;" valign="top">
<table align="center" cellpadding="0" cellspacing="0" class="social_table" role="presentation" style="table-layout: fixed; vertical-align: top; border-spacing: 0; border-collapse: collapse; mso-table-tspace: 0; mso-table-rspace: 0; mso-table-bspace: 0; mso-table-lspace: 0;" valign="top">
<tbody>
<tr align="center" style="vertical-align: top; display: inline-block; text-align: center;" valign="top">
<td style="word-break: break-word; vertical-align: top; padding-bottom: 0; padding-right: 2.5px; padding-left: 2.5px;" valign="top"><a href="https://www.facebook.com/anup.macwan" target="_blank"><img alt="Facebook" height="32" src="https://i.imgur.com/N0xltuY.png" style="text-decoration: none; -ms-interpolation-mode: bicubic; height: auto; border: 0; display: block;" title="facebook" width="32"/></a></td>
<td style="word-break: break-word; vertical-align: top; padding-bottom: 0; padding-right: 2.5px; padding-left: 2.5px;" valign="top"><a href="https://www.twitter.com/anupmac6" target="_blank"><img alt="Twitter" height="32" src="https://i.imgur.com/mHZsLJn.png" style="text-decoration: none; -ms-interpolation-mode: bicubic; height: auto; border: 0; display: block;" title="twitter" width="32"/></a></td>
<td style="word-break: break-word; vertical-align: top; padding-bottom: 0; padding-right: 2.5px; padding-left: 2.5px;" valign="top"><a href="https://www.linkedin.com/in/anupmacwan" target="_blank"><img alt="Linkedin" height="32" src="https://i.imgur.com/cWt9JFY.png" style="text-decoration: none; -ms-interpolation-mode: bicubic; height: auto; border: 0; display: block;" title="linkedin" width="32"/></a></td>
<td style="word-break: break-word; vertical-align: top; padding-bottom: 0; padding-right: 2.5px; padding-left: 2.5px;" valign="top"><a href="https://www.instagram.com/anup_macwan" target="_blank"><img alt="Instagram" height="32" src="https://i.imgur.com/SUPNe0f.png" style="text-decoration: none; -ms-interpolation-mode: bicubic; height: auto; border: 0; display: block;" title="instagram" width="32"/></a></td>
</tr>
</tbody>
</table>
</td>
</tr>
</tbody>
</table>
<!--[if (!mso)&(!IE)]><!-->
</div>
<!--<![endif]-->
</div>
</div>
<!--[if (mso)|(IE)]></td></tr></table><![endif]-->
<!--[if (mso)|(IE)]></td></tr></table></td></tr></table><![endif]-->
</div>
</div>
</div>
<div style="background-color:#ffffff;">
<div class="block-grid" style="min-width: 320px; max-width: 680px; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; Margin: 0 auto; background-color: transparent;">
<div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
<!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;"><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:680px"><tr class="layout-full-width" style="background-color:transparent"><![endif]-->
<!--[if (mso)|(IE)]><td align="center" width="680" style="background-color:transparent;width:680px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top:5px; padding-bottom:5px;"><![endif]-->
<div class="col num12" style="min-width: 320px; max-width: 680px; display: table-cell; vertical-align: top; width: 680px;">
<div class="col_cont" style="width:100% !important;">
<!--[if (!mso)&(!IE)]><!-->
<div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:5px; padding-bottom:5px; padding-right: 0px; padding-left: 0px;">
<!--<![endif]-->
<!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 10px; padding-left: 10px; padding-top: 10px; padding-bottom: 10px; font-family: Arial, sans-serif"><![endif]-->
<div style="color:#393d47;font-family:Helvetica Neue, Helvetica, Arial, sans-serif;line-height:1.2;padding-top:10px;padding-right:10px;padding-bottom:10px;padding-left:10px;">
<div style="line-height: 1.2; font-size: 12px; color: #393d47; font-family: Helvetica Neue, Helvetica, Arial, sans-serif; mso-line-height-alt: 14px;">
<p style="font-size: 12px; line-height: 1.2; word-break: break-word; text-align: center; mso-line-height-alt: 14px; margin: 0;"><span style="font-size: 12px;"><a href="http://www.example.com" rel="noopener" style="color: #ff5c5c;" target="_blank">Unsubscribe</a></span></p>
</div>
</div>
<!--[if mso]></td></tr></table><![endif]-->
<!--[if (!mso)&(!IE)]><!-->
</div>
<!--<![endif]-->
</div>
</div>
<!--[if (mso)|(IE)]></td></tr></table><![endif]-->
<!--[if (mso)|(IE)]></td></tr></table></td></tr></table><![endif]-->
</div>
</div>
</div>
<div style="background-color:transparent;">
<div class="block-grid two-up no-stack" style="min-width: 320px; max-width: 680px; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; Margin: 0 auto; background-color: transparent;">
<div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
<!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:transparent;"><tr><td align="center"><table cellpadding="0" cellspacing="0" border="0" style="width:680px"><tr class="layout-full-width" style="background-color:transparent"><![endif]-->
<!--[if (mso)|(IE)]><td align="center" width="340" style="background-color:transparent;width:340px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top:10px; padding-bottom:10px;"><![endif]-->
<div class="col num6" style="display: table-cell; vertical-align: top; max-width: 320px; min-width: 336px; width: 340px;">
<div class="col_cont" style="width:100% !important;">
</div>
</div>
<!--[if (mso)|(IE)]></td></tr></table><![endif]-->
<!--[if (mso)|(IE)]></td><td align="center" width="340" style="background-color:transparent;width:340px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 0px; padding-left: 0px; padding-top:10px; padding-bottom:10px;"><![endif]-->

<!--[if (mso)|(IE)]></td></tr></table><![endif]-->
<!--[if (mso)|(IE)]></td></tr></table></td></tr></table><![endif]-->
</div>
</div>
</div>
<!--[if (mso)|(IE)]></td></tr></table><![endif]-->
</td>
</tr>
</tbody>
</table>
<!--[if (IE)]></div><![endif]-->
</body>
</html>`;
  const msg = {
    to: "fakulty31@gmail.com", // Change to your recipient
    from: "anupmac6@gmail.com", // Change to your verified sender
    subject: "Bible in a year - Day 7",
    html: email,
  };
  try {
    const response = sgMail.send(msg);
    return response;
  } catch (error) {
    console.error(error);

    if (error.response) {
      console.error(error.response.body);
    }
    return error;
  }
};
