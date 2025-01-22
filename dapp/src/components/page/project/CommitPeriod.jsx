import { LeftArrowIcon, NextIcon, RightArrowIcon } from "components/icons";

const CommitPeriod = ({ startDate, endDate, currentPage, onPageChange }) => {
  // const [showDatePicker, setShowDatePicker] = useState(false);

  return (
    <>
      <div className="flex justify-between">
        {/* <div className="flex gap-3"> */}
        <div className="px-[18px] flex items-center gap-[18px]">
          <button
            onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
          >
            <LeftArrowIcon />
          </button>
          <p className="leading-5 text-base lg:text-lg text-primary">
            {startDate} - {endDate}
          </p>
          <button onClick={() => onPageChange(currentPage + 1)}>
            <RightArrowIcon />
          </button>
        </div>
        {/* <button className="p-[12px_18px] bg-primary" onClick={() => setShowDatePicker(true)}>
                        <CalendarIcon />
                    </button>
                </div>
                <div className="px-[18px] flex items-center gap-3">
                    <p className="leading-5 text-lg text-primary">
                        Latest Commit
                    </p>
                    <NextIcon />
                </div> */}
      </div>
      {/* {showDatePicker && (
                <Modal onClose={() => setShowDatePicker(false)}>
                    <div className="p-9 w-[1048px] flex flex-col gap-[30px]">
                        <div className="flex flex-col gap-3">
                            <p className="leading-6 text-xl text-primary">
                                Select Commit History Period
                            </p>
                            <p className="text-base text-secondary">
                                Choose from predefined date ranges to view commit history.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3">
                            {dateRanges.map((dateRange, index) => (
                                <div key={index} className="py-3 flex justify-between">
                                    <p className="leading-5 text-xl font-medium text-primary">
                                        {formatDate(dateRange.startDate)} - {formatDate(dateRange.endDate)}
                                    </p>
                                    <p className="leading-5 text-xl text-[#D78A00] underline cursor-pointer" onClick={() => {
                                        setShowDatePicker(false);
                                    }}>
                                        Select
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </Modal>
            )} */}
    </>
  );
};

export default CommitPeriod;
