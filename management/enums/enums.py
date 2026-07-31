#storing all of our enums (values that wont change here)

from enum import Enum


#used in booking schema
class Status(str, Enum):
    PENDING = "Pending"
    COMPLETED = "Completed"
    CONFIRMED = "Confirmed"
    CANCELLED = "Cancelled"
#used in availability schema   
class Day(str, Enum):
    MONDAY = "Monday"
    TUESDAY = "Tuesday"
    WEDNESDAY = "Wednesday"
    THURSDAY = "Thursday"
    FRIDAY = "Friday"
    SATURDAY = "Saturday"
    SUNDAY = "Sunday"

#used in file route
class AllowedFileTypes(str, Enum):
    PDF = ".pdf"
    DOCX = ".docx"
    DOC = ".doc"
    TXT = ".txt"
    JPG = ".jpg"
    PNG = ".png"
    
class LanguageCode(str, Enum):
    ES = "Espanol"
    HT = "Haitian-Creole"
    EN = "English"
    
class UserRole(str, Enum):
    ADMIN = "admin"
    TUTOR = "tutor"
    LEARNER = "learner"

class LessonStatus(str, Enum):
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"